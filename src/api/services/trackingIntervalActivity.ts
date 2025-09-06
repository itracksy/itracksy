import { Activity } from "@/types/activity";
import { upsertActivity } from "./activities";
import { TRACKING_INTERVAL } from "../../config/tracking";
import { extractDomainWindows, urlContainsDomain } from "../../utils/url";
import { logger } from "../../helpers/logger";
import { getCurrentUserIdLocalStorage, isTimeExceededNotificationEnabled } from "./userSettings";
import {
  createTimeEntry,
  getActiveTimeEntry,
  updateTimeEntry,
  getLastSessionByMode,
} from "./timeEntry";
import { sendNotificationService, sendNotificationWhenNoActiveEntry } from "./notification";
import { createNotification } from "./notifications";
import db from "../db";
import { timeEntries } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { formatDuration } from "../../utils/formatTime";
import { getTray } from "../../main";
import { extractUrlFromBrowserTitle } from "../../helpers/extractUrlFromBrowserTitle";
import { findMatchingRules } from "./activityRules";
import { showBlockingNotification } from "./blocking-notification-service";
import { sendClockUpdate } from "../../helpers/ipc/clock/clock-listeners";
import { onSystemStateChange, isSystemActive } from "./systemMonitor";
import { pauseActiveSession, resumeActiveSession, clearPausedSession } from "./sessionPause";

// Export debug utilities for development
export { debugSystemState, testSystemMonitoring } from "./systemMonitorDebug";

let trackingIntervalId: NodeJS.Timeout | null = null;
let lastNotificationTime: number = 0;
let isTrackingPaused: boolean = false;
let systemMonitorUnsubscribe: (() => void) | null = null;

let isAccessibilityError: boolean = false;
const NOTIFICATION_COOLDOWN = 10 * 1000; // 10 seconds in milliseconds

/**
 * Update tray status when system becomes active
 */
const updateTrayForActiveSystem = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return;
    }

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry || activeEntry.endTime) {
      const tray = getTray();
      if (tray) {
        tray.setTitle("");
      }
      return;
    }

    // Update tray with current session info
    const durationInSeconds = Math.floor((Date.now() - activeEntry.startTime) / 1000);
    const formattedDuration = formatDuration(durationInSeconds);
    const modePrefix = activeEntry.isFocusMode ? "🎯" : "🚀";

    const tray = getTray();
    if (tray) {
      tray.setTitle(`${modePrefix} ${formattedDuration}`);
    }
  } catch (error) {
    logger.error("[updateTrayForActiveSystem] Error updating tray", { error });
  }
};

export const startTracking = async (): Promise<void> => {
  // Clear any existing interval
  stopTracking();

  // Set up system state monitoring
  systemMonitorUnsubscribe = onSystemStateChange(async (isActive: boolean) => {
    if (isActive) {
      logger.info("[Tracking] System became active - resuming tracking");
      isTrackingPaused = false;
      // Resume any paused session
      await resumeActiveSession();
      // Update tray to show current status when system becomes active
      await updateTrayForActiveSystem();
    } else {
      logger.info("[Tracking] System became inactive - pausing tracking");
      isTrackingPaused = true;
      // Pause the current session
      await pauseActiveSession();
      // Update tray to show paused status
      const tray = getTray();
      if (tray) {
        tray.setTitle("💤"); // Sleep emoji to indicate paused state
      }
    }
  });

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    try {
      // Skip tracking if system is inactive (sleeping, locked, or idle)
      if (isTrackingPaused || !isSystemActive()) {
        return;
      }

      const userId = await getCurrentUserIdLocalStorage();
      if (!userId) {
        return;
      }

      const activeEntry = await getActiveTimeEntry(userId);

      if (!activeEntry || activeEntry.endTime) {
        // No active entry, or entry has ended
        sendNotificationWhenNoActiveEntry(userId);
        // Update tray title to default
        const tray = getTray();
        if (tray) {
          tray.setTitle("");
        }
        return;
      }

      // Update tray title with duration and mode
      const elapsedSeconds = Math.floor((Date.now() - activeEntry.startTime) / 1000);
      const formattedDuration = formatDuration(elapsedSeconds);
      // Use emoji for mode (🎯=Focus, 🚀=Break)
      const modePrefix = activeEntry.isFocusMode ? "🎯" : "🚀";

      const tray = getTray();
      if (tray) {
        // Keep the title short to fit within macOS tray title character limit
        // Format: F 12:34 or B 12:34
        tray.setTitle(`${modePrefix} ${formattedDuration}`);
      }

      // Send update to clock window
      await sendClockUpdate({
        activeEntry,
        currentTime: Date.now(),
        elapsedSeconds: elapsedSeconds,
      });

      const targetSeconds = (activeEntry.targetDuration ?? 0) * 60;
      const timeRemaining = targetSeconds - elapsedSeconds;

      // Send 1-minute warning notification if enabled
      if (timeRemaining > 0) {
        const notificationsEnabled = await isTimeExceededNotificationEnabled();
        if (notificationsEnabled) {
          await sendNotificationService(activeEntry, timeRemaining);
        }
      }

      const timeExceeded = elapsedSeconds - targetSeconds;
      if (timeExceeded > 0) {
        if (activeEntry.autoStopEnabled) {
          //stop the session when time is exceeded
          await updateTimeEntry(activeEntry.id, { endTime: Date.now() });

          // Auto-start new session with opposite mode
          const newMode = !activeEntry.isFocusMode; // Switch mode

          // Get duration from last session of the new mode
          const lastSessionOfNewMode = await getLastSessionByMode(userId, newMode);
          const defaultDuration = newMode ? 25 : 15; // Fallback defaults
          const targetDuration = lastSessionOfNewMode?.targetDuration ?? defaultDuration;
          const description = newMode ? "Focus Time" : "Break Time";

          await createTimeEntry(
            {
              isFocusMode: newMode,
              startTime: Date.now(),
              targetDuration: targetDuration,
              description: description,
              autoStopEnabled: activeEntry.autoStopEnabled, // Preserve auto-stop setting
            },
            userId
          );

          return;
        }
      }

      if (isAccessibilityError) {
        return;
      }

      const getWindows = await import("get-windows");

      const result = await getWindows.activeWindow({
        accessibilityPermission: true,
        screenRecordingPermission: true,
      });

      if (!result) {
        logger.warn("[startTracking] No active window result returned");
        return;
      }

      const transformedActivities: Activity = {
        platform: result.platform,
        isFocusMode: activeEntry.isFocusMode,
        activityId: result.id,
        timeEntryId: activeEntry.id,
        title: result.title,
        ownerPath: result.owner.path,
        ownerProcessId: result.owner.processId,
        ownerName: result.owner.name,
        timestamp: Date.now(),
        duration: TRACKING_INTERVAL / 1000, // seconds
        url:
          result.platform === "windows" &&
          (result.owner.name === "Google Chrome" ||
            result.owner.name === "Mozilla Firefox" ||
            result.owner.name === "Microsoft Edge")
            ? extractUrlFromBrowserTitle(result.title, result.owner.name)
            : //@ts-ignore
              result.url,
        userId,
      };

      const url = transformedActivities.url?.toLowerCase();
      const extractedDomain = url ? extractDomainWindows(url) : null;

      const appName = transformedActivities.ownerName.toLowerCase();

      // Define rule with a default value to avoid reference errors

      const rule = await findMatchingRules(transformedActivities);

      const isBlocked = rule && rule.rating === 0;
      console.log("isBlocked", isBlocked);
      await upsertActivity({ ...transformedActivities, rating: rule ? rule.rating : null });

      // Check if this is a domain-based rule (rule has a non-empty domain property)
      const isBlockedDomain = rule?.domain && rule.domain.trim() !== "";

      // Show notification in full-screen window
      if (
        activeEntry.isFocusMode &&
        isBlocked &&
        (!activeEntry.whiteListedActivities ||
          !activeEntry.whiteListedActivities
            .split(",")
            .includes(isBlockedDomain ? (extractedDomain ?? "unknown") : appName)) &&
        Date.now() - lastNotificationTime >= NOTIFICATION_COOLDOWN
      ) {
        showNotificationWarningBlock({
          title: transformedActivities.title,
          detail: `Blocked by rule: ${rule?.name || "Unknown"}`,
          userId,
          timeEntryId: activeEntry.id,
          appOrDomain: isBlockedDomain ? (extractedDomain ?? "unknown") : appName,
        });
      }
    } catch (error) {
      // Check if the error is related to accessibility permissions
      isAccessibilityError = Boolean(
        error &&
          typeof error === "object" &&
          "stdout" in error &&
          typeof error.stdout === "string" &&
          error.stdout.includes("permission")
      );

      logger.error("[startTracking] Error occurred while tracking", { error });
      throw error;
    }
  }, TRACKING_INTERVAL);
};

export const stopTracking = (): void => {
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }

  // Clean up system monitor subscription
  if (systemMonitorUnsubscribe) {
    systemMonitorUnsubscribe();
    systemMonitorUnsubscribe = null;
  }

  // Clear any paused session state
  clearPausedSession();

  // Reset tracking state
  isTrackingPaused = false;
};

// No longer needed as we're using sendBlockingNotificationToWindow
// function createNotificationWarningBlockWindow() has been removed

function showNotificationWarningBlock({
  title,
  detail,
  userId,
  timeEntryId,
  appOrDomain,
}: {
  title: string;
  detail: string;
  userId: string;
  timeEntryId: string;
  appOrDomain: string;
}) {
  createNotification({
    title,
    body: detail,
    type: "blocking_notification",
    userId,
    createdAt: Date.now(),
    timeEntryId,
  });

  // Send blocking notification to a dedicated window
  showBlockingNotification({
    title,
    detail,
    userId,
    timeEntryId,
    appOrDomain,
  })
    .then(async (response: number) => {
      lastNotificationTime = Date.now();

      // Handle response based on button clicked
      if (response === 0) {
        // User chose "Continue Working"
        await db
          .update(timeEntries)
          .set({
            whiteListedActivities: sql`CASE
              WHEN white_listed_activities IS NULL OR white_listed_activities = '' THEN ${appOrDomain}
              ELSE white_listed_activities || ',' || ${appOrDomain}
            END`,
          })
          .where(eq(timeEntries.id, timeEntryId));
      } else if (response === 1) {
        // User chose "Return to Focus"
        // Continue showing notifications after cooldown
      } else if (response === 2) {
        // User chose "Take a Break"
        const userId = await getCurrentUserIdLocalStorage();
        if (!userId) {
          return;
        }
        // get the current time entry and stop it
        const timeEntry = await getActiveTimeEntry(userId);
        if (!timeEntry) {
          return;
        }
        await updateTimeEntry(timeEntry.id, { endTime: Date.now() });
        // start a new time entry in break mode
        await createTimeEntry(
          {
            isFocusMode: false,
            startTime: Date.now(),
            targetDuration: 15,
            description: "Break Time",
          },
          userId
        );
      } else if (response === -1) {
        // User dismissed the notification without making a choice
        logger.info("[showNotificationWarningBlock] Notification dismissed without action");
        // Similar to "Return to Focus" - continue showing notifications after cooldown
      }
    })
    .catch((error: Error) => {
      logger.error("[showNotificationWarningBlock] Error showing blocking notification", { error });
    });
}

import { Activity } from "@/types/activity";
import { BrowserWindow, dialog, screen } from "electron";
import { upsertActivity } from "./activities";
import { TRACKING_INTERVAL } from "../../config/tracking";
import { extractDomainWindows, urlContainsDomain } from "../../utils/url";
import { logger } from "../../helpers/logger";
import { getCurrentUserIdLocalStorage } from "./userSettings";
import { createTimeEntry, getActiveTimeEntry, updateTimeEntry } from "./timeEntry";
import { sendNotificationService, sendNotificationWhenNoActiveEntry } from "./notification";
import { createNotification } from "./notifications";
import db from "../db";
import { timeEntries } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { formatDuration } from "../../utils/formatTime";
import { getTray } from "../../main";
import { extractUrlFromBrowserTitle } from "../../helpers/extractUrlFromBrowserTitle";
import { findMatchingDistractingRules } from "./activityRules";

let trackingIntervalId: NodeJS.Timeout | null = null;
let notificationWindow: BrowserWindow | null = null;

let lastNotificationTime: number = 0;

let isAccessibilityError: boolean = false;
const NOTIFICATION_COOLDOWN = 10 * 1000; // 10 seconds in milliseconds

export const startTracking = async (): Promise<void> => {
  // Clear any existing interval
  stopTracking();

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    try {
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
      const durationInSeconds = Math.floor((Date.now() - activeEntry.startTime) / 1000);
      const formattedDuration = formatDuration(durationInSeconds);
      // Use a simple character prefix for mode (F=Focus, B=Break)
      const modePrefix = activeEntry.isFocusMode ? "F" : "B";

      const tray = getTray();
      if (tray) {
        // Keep the title short to fit within macOS tray title character limit
        // Format: F 12:34 or B 12:34
        tray.setTitle(`${modePrefix} ${formattedDuration}`);
      }

      const timeExceeded =
        Math.floor((Date.now() - activeEntry.startTime) / 1000) -
        (activeEntry.targetDuration ?? 0) * 60;

      if (timeExceeded > 0) {
        await sendNotificationService(activeEntry, timeExceeded);
        if (activeEntry.autoStopEnabled) {
          //stop the session when time is exceeded
          await updateTimeEntry(activeEntry.id, { endTime: Date.now() });
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
      logger.info("result", result);

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
      const rule = await findMatchingDistractingRules(transformedActivities);

      const isBlocked = rule && rule.rating === 0;

      await upsertActivity({ ...transformedActivities, rating: rule ? rule.rating : null });
      console.log("rule", rule);

      const isBlockedDomain = rule?.ruleType === "domain";
      // Show notification in full-screen window
      if (
        isBlocked &&
        (!activeEntry.whiteListedActivities ||
          !activeEntry.whiteListedActivities
            .split(",")
            .includes(isBlockedDomain ? (extractedDomain ?? "unknown") : appName)) &&
        Date.now() - lastNotificationTime >= NOTIFICATION_COOLDOWN
      ) {
        showNotificationWarningBlock({
          title: transformedActivities.title,
          detail: transformedActivities.ownerPath || "",
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

      if (isAccessibilityError) {
        const { response } = await dialog.showMessageBox({
          type: "error",
          title: "Permission Required",
          message: "Accessibility Permission Required",
          detail:
            "iTracksy requires accessibility permission to track window activity.\n\nPlease enable it in System Settings › Privacy & Security › Accessibility.",
          buttons: ["Open Settings", "Cancel"],
        });
        if (response === 0) {
          // Open System Preferences to the Security & Privacy pane
          require("child_process").exec(
            "open x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
          );
        }
      }
      logger.error("[startTracking] Error occurred while tracking", { error });
      throw error;
    }
  }, TRACKING_INTERVAL);
};

const stopTracking = (): void => {
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }
};

function createNotificationWarningBlockWindow() {
  // Get the current mouse position to determine active screen
  const mousePoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(mousePoint);
  const { width, height } = currentDisplay.workAreaSize;

  notificationWindow = new BrowserWindow({
    width,
    height,
    frame: true, // Change to true to show the window frame with system controls
    transparent: true,
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent black background
    hasShadow: true, // Enable shadow for better visibility of the window
    alwaysOnTop: true,
    type: "panel",
    skipTaskbar: false, // Show in taskbar to allow users to find it
    show: false,
    movable: false, // Allow the window to be moved
    resizable: true, // Allow resizing
    minimizable: true, // Allow minimizing
    maximizable: true, // Allow maximizing
    closable: true, // Allow closing
    focusable: true, // Allow focusing the window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    vibrancy: "under-window", // Add vibrancy effect (macOS)
    visualEffectState: "active", // Ensure visual effect is active
    titleBarStyle: "hiddenInset", // Use hidden inset style for macOS (shows only the traffic lights)
  });

  // Set window to be always on top with highest level
  notificationWindow.setAlwaysOnTop(true, "screen-saver");
  notificationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  notificationWindow.moveTop();

  notificationWindow.setTitle("iTracksy - Work Activity Alert");

  // Set window bounds to cover current display
  notificationWindow.setBounds(currentDisplay.bounds);

  // Add blur effect for Windows and Linux (not needed for macOS as vibrancy handles it)
  if (process.platform !== "darwin") {
    notificationWindow.setBackgroundColor("rgba(0, 0, 0, 0.7)");
  }

  return notificationWindow;
}

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
  if (!notificationWindow || notificationWindow.isDestroyed()) {
    notificationWindow = createNotificationWarningBlockWindow();
  } else {
    if (notificationWindow.isVisible()) {
      // Window is already visible, don't show another notification
      return;
    }
  }

  // Update last notification time
  lastNotificationTime = Date.now();

  // Ensure window is at the front
  notificationWindow.moveTop();
  notificationWindow.show();
  notificationWindow.focus();

  const options = {
    type: "question" as const,
    title: "iTracksy - Work Activity Alert",
    message: `Activity Detection: ${title}`,
    detail: `${detail}\n\nPlease choose how you want to proceed with your current activity. Your choice helps us better track your work patterns and productivity.\n\nNote: Your response affects how iTracksy monitors your future activities.`,
    buttons: [
      "✓ Continue Working - This activity is work-related",
      "⚠️ Return to Focus - Switch back to your primary task",
      "🕒 Take a Break - Pause tracking for 15 minutes",
    ],
    defaultId: 0,
    noLink: true,
  };

  dialog.showMessageBox(notificationWindow, options).then(async (value) => {
    switch (value.response) {
      case 0: // This is part of my work
        // Update whitelisted activities by appending new app/domain
        await db
          .update(timeEntries)
          .set({
            whiteListedActivities: sql`CASE
              WHEN white_listed_activities IS NULL OR white_listed_activities = '' THEN ${appOrDomain}
              ELSE white_listed_activities || ',' || ${appOrDomain}
            END`,
          })
          .where(eq(timeEntries.id, timeEntryId));
        break;
      case 1: // You are on focus mode, come back to it!
        // Continue showing notifications after cooldown

        break;
      case 2: // Break in 15 min
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
        break;
    }

    // Hide the window after dialog is closed
    if (notificationWindow && !notificationWindow.isDestroyed()) {
      notificationWindow.hide();
    }
  });
}

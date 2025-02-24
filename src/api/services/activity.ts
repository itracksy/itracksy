import { ActivityRecord } from "@/types/activity";
import { BrowserWindow, dialog, screen } from "electron";
import { upsertActivity } from "../db/repositories/activities";
import { LIMIT_TIME_APART, TRACKING_INTERVAL } from "../../config/tracking";
import { extractUrlFromBrowserTitle } from "../../helpers/extractUrlFromBrowserTitle";
import { logger } from "../../helpers/logger";
import {
  getCurrentUserIdLocalStorage,
  getUserBlockedApps,
  getUserBlockedDomains,
  getUserSettings,
} from "../../api/db/repositories/userSettings";
import { getActiveTimeEntry } from "./timeEntry";

let trackingIntervalId: NodeJS.Timeout | null = null;
let notificationWindow: BrowserWindow | null = null;
let breakTimer: NodeJS.Timeout | null = null;
let lastNotificationTime: number = 0;
let isNotificationEnabled: boolean = true;
let isAccessibilityError: boolean = false;
const NOTIFICATION_COOLDOWN = 60 * 1000; // 1 minute in milliseconds

export const startTracking = async (): Promise<void> => {
  // Clear any existing interval
  stopTracking();

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    try {
      logger.info("[activity.startTracking] Starting interval");
      const userId = await getCurrentUserIdLocalStorage();
      if (!userId) {
        return;
      }
      const activitySettings = await getUserSettings({ userId });
      if (!activitySettings.isFocusMode) {
        return;
      }
      const activeEntry = await getActiveTimeEntry(userId);

      if (!activeEntry) {
        return;
      }
      if (activeEntry.endTime) {
        return;
      }
      if (isAccessibilityError) {
        return;
      }
      const getWindows = await import("get-windows");
      const blockedApps = await getUserBlockedApps(userId);
      const blockedDomains = await getUserBlockedDomains(userId);
      const result = await getWindows.activeWindow({
        accessibilityPermission: activitySettings.accessibilityPermission,
        screenRecordingPermission: activitySettings.screenRecordingPermission,
      });
      logger.debug("[startTracking] Attempting to get active window", activitySettings);
      if (!result) {
        logger.warn("[startTracking] No active window result returned", { activitySettings });
        return;
      }

      const transformedActivities: ActivityRecord = {
        platform: result.platform,
        activityId: result.id,
        timeEntryId: activeEntry.id,
        title: result.title,
        ownerPath: result.owner.path,
        ownerProcessId: result.owner.processId,
        ownerName: result.owner.name,
        timestamp: Date.now(),
        duration: TRACKING_INTERVAL,
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

      await upsertActivity(transformedActivities);
      if (activitySettings.isFocusMode) {
        const url = transformedActivities.url;
        console.log("[startTracking] url", url);
        const appName = transformedActivities.ownerName;
        const isBlockedApp =
          appName &&
          blockedApps.some((app) => appName.toLowerCase().includes(app.appName.toLowerCase()));
        const isBlockedDomain =
          url &&
          url.trim().length > 0 &&
          blockedDomains.some(({ domain }) =>
            result.platform === "windows"
              ? domain.includes(url.toLowerCase())
              : url.includes(domain)
          );
        // Show notification in full-screen window
        if (
          (isBlockedDomain || isBlockedApp) &&
          isNotificationEnabled &&
          Date.now() - lastNotificationTime >= NOTIFICATION_COOLDOWN
        ) {
          showNotification(transformedActivities.title, transformedActivities.ownerPath || "");
        }
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

function createNotificationWindow() {
  // Get the current mouse position to determine active screen
  const mousePoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(mousePoint);
  const { width, height } = currentDisplay.workAreaSize;

  notificationWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: true,
    type: "panel",
    skipTaskbar: true,
    show: false,
    movable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set window to be always on top with highest level
  notificationWindow.setAlwaysOnTop(true, "screen-saver");
  notificationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  notificationWindow.moveTop();

  // Make window draggable from any point
  notificationWindow.webContents.on("did-finish-load", () => {
    notificationWindow?.webContents.insertCSS(`
      body {
        -webkit-app-region: drag;
      }
      button, input, a {
        -webkit-app-region: no-drag;
      }
    `);
  });

  // Set window bounds to cover current display
  notificationWindow.setBounds(currentDisplay.bounds);

  return notificationWindow;
}

function showNotification(title: string, detail: string) {
  if (!notificationWindow || notificationWindow.isDestroyed()) {
    notificationWindow = createNotificationWindow();
  }

  // Update last notification time
  lastNotificationTime = Date.now();

  // Ensure window is at the front
  notificationWindow.moveTop();
  notificationWindow.show();
  notificationWindow.focus();

  const options = {
    type: "question" as const,
    title: "iTracksy - Activity Update",
    message: `iTracksy - ${title}`,
    detail: detail,
    buttons: ["Yes", "No", "Break in 15 min"],
    cancelId: 1, // 'No' button is the cancel button
    defaultId: 0, // 'Yes' button is the default
    noLink: true,
  };

  dialog.showMessageBox(notificationWindow, options).then((value) => {
    switch (value.response) {
      case 0: // Yes
        // Continue showing notifications after cooldown
        isNotificationEnabled = true;
        break;
      case 1: // No
        // Disable notifications
        isNotificationEnabled = false;
        break;
      case 2: // Break in 15 min
        // Clear any existing break timer
        if (breakTimer) {
          clearTimeout(breakTimer);
        }

        // Set a new break timer
        breakTimer = setTimeout(() => {
          showNotification(
            "Time for a Break",
            "It's been 15 minutes since you requested a break. Would you like to take it now?"
          );
          breakTimer = null;
        }, LIMIT_TIME_APART); // 15 minutes in milliseconds
        break;
    }

    // Hide the window after dialog is closed
    if (notificationWindow && !notificationWindow.isDestroyed()) {
      notificationWindow.hide();
    }
  });
}

import { BrowserWindow, app, dialog, ipcMain, screen, Tray } from "electron";
import {
  WIN_CLEAR_ACTIVITIES_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_GET_ACTIVITIES_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_SET_USER_INFORMATION_CHANNEL,
  WIN_GET_APP_VERSION_CHANNEL,
  WIN_CHECK_UPDATES_CHANNEL,
  WIN_GET_LOG_FILE_CONTENT_CHANNEL,
} from "./window-channels";

import { ActivityRecord } from "@/types/activity";
import { safelyRegisterListener } from "../safelyRegisterListener";
import { addActivity, getActivities, clearActivities } from "../../../services/ActivityStorage";
import { TRACKING_INTERVAL } from "../../../config/tracking";
import { extractUrlFromBrowserTitle } from "./helper";
import { logger } from "../../../helpers/logger";
let trackingIntervalId: NodeJS.Timeout | null = null;
let mainWindowRef: BrowserWindow | null = null;
let trayRef: Tray | null = null;
let notificationWindow: BrowserWindow | null = null;
let breakTimer: NodeJS.Timeout | null = null;
let lastNotificationTime: number = 0;
let isNotificationEnabled: boolean = true;

const NOTIFICATION_COOLDOWN = 60 * 1000; // 1 minute in milliseconds

export const addWindowEventListeners = (mainWindow: BrowserWindow, tray: Tray | null) => {
  logger.debug("WindowListeners: Adding listeners", { hasTray: !!tray });
  mainWindowRef = mainWindow;
  trayRef = tray;
  // Register window event handlers
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => mainWindow?.minimize());
  safelyRegisterListener(WIN_GET_APP_VERSION_CHANNEL, () => {
    return app.getVersion();
  });

  safelyRegisterListener(WIN_CHECK_UPDATES_CHANNEL, async () => {
    try {
      logger.info("Checking for updates...");
      // Implement your update check logic here
      // For example, if using electron-updater:
      // await autoUpdater.checkForUpdates();
      return { status: "success", message: "Update check completed" };
    } catch (error) {
      logger.error("Failed to check for updates", error);
      throw error;
    }
  });
  safelyRegisterListener(WIN_GET_LOG_FILE_CONTENT_CHANNEL, async () => {
    try {
      const logFileContent = await logger.getFileContent();
      return logFileContent;
    } catch (error) {
      logger.error("Failed to get log file content", error);
      throw error;
    }
  });
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => {
    try {
      mainWindow.minimize();
    } catch (error) {
      logger.error("Failed to minimize window", { error });
    }
  });

  safelyRegisterListener(WIN_MAXIMIZE_CHANNEL, () => {
    try {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    } catch (error) {
      logger.error("Failed to maximize/unmaximize window", { error });
    }
  });

  safelyRegisterListener(WIN_CLOSE_CHANNEL, () => {
    try {
      mainWindow.close();
    } catch (error) {
      logger.error("Failed to close window", { error });
    }
  });

  safelyRegisterListener(
    WIN_START_TRACKING_CHANNEL,
    async (
      _,
      params: {
        accessibilityPermission: boolean;
        screenRecordingPermission: boolean;
        blockedDomains: string[];
        blockedApps: string[];
        isFocusMode: boolean;
      }
    ) => {
      return await startTracking(params);
    }
  );

  safelyRegisterListener(WIN_STOP_TRACKING_CHANNEL, () => {
    try {
      stopTracking();
    } catch (error) {
      logger.error("Failed to stop tracking", { error });
    }
  });

  safelyRegisterListener(WIN_CLEAR_ACTIVITIES_CHANNEL, async () => {
    try {
      return await clearActivities();
    } catch (error) {
      logger.error("Failed to clear activities", { error });
      throw error;
    }
  });

  safelyRegisterListener(WIN_GET_ACTIVITIES_CHANNEL, async () => {
    try {
      return await getActivities();
    } catch (error) {
      logger.error("Failed to get activities", { error });
      throw error;
    }
  });

  safelyRegisterListener(
    WIN_SET_USER_INFORMATION_CHANNEL,
    (_event, params: { userId: string; sessionId: string }) => {
      try {
        return logger.setUserInformation(params);
      } catch (error) {
        logger.error("Failed to set user information", { error, params });
        throw error;
      }
    }
  );
  safelyRegisterListener(WIN_UPDATE_TRAY_TITLE_CHANNEL, (_event, title: string) => {
    try {
      if (trayRef) {
        trayRef.setTitle(title);
      }
    } catch (error) {
      logger.error("Failed to update tray title", { error, title });
    }
  });
};

const startTracking = async (params: {
  accessibilityPermission: boolean;
  screenRecordingPermission: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  isFocusMode: boolean;
}): Promise<void> => {
  logger.debug("[startTracking] Window: Calling startTracking", params);

  // Clear any existing interval
  stopTracking();

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    try {
      const getWindows = await import("get-windows");
      logger.debug("[startTracking] Attempting to get active window");

      const result = await getWindows.activeWindow(params);
      if (!result) {
        logger.warn("[startTracking] No active window result returned", { params });
        return;
      }

      logger.debug("[startTracking] Active window data", {
        platform: result.platform,
        title: result.title,
        ownerName: result?.owner?.name,
        ownerPath: result?.owner?.path,
      });

      const transformedActivities: ActivityRecord = {
        platform: result.platform,
        id: result.id,
        title: result.title,
        ownerPath: result.owner.path,
        ownerProcessId: result.owner.processId,
        ownerName: result.owner.name,
        timestamp: Date.now(),
        count: 1,
        url:
          result.platform === "windows" &&
          (result.owner.name === "Google Chrome" ||
            result.owner.name === "Mozilla Firefox" ||
            result.owner.name === "Microsoft Edge")
            ? extractUrlFromBrowserTitle(result.title, result.owner.name)
            : //@ts-ignore
              result.url,
      };

      logger.debug("[startTracking] Transformed activity data", transformedActivities);

      await addActivity(transformedActivities);
      if (params.isFocusMode) {
        const url = transformedActivities.url;
        const appName = transformedActivities.ownerName;
        const isBlockedApp =
          appName &&
          params.blockedApps.some((app) => appName.toLowerCase().includes(app.toLowerCase()));
        const isBlockedDomain =
          url &&
          url.trim().length > 0 &&
          params.blockedDomains.some((domain) =>
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
      logger.error("[startTracking] Error occurred while tracking", { error });
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
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set window to be always on top with highest level
  notificationWindow.setAlwaysOnTop(true, "screen-saver");
  notificationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  notificationWindow.moveTop();

  // Set window bounds to cover all displays
  const displays = screen.getAllDisplays();
  const totalBounds = displays.reduce(
    (bounds, display) => {
      bounds.x = Math.min(bounds.x, display.bounds.x);
      bounds.y = Math.min(bounds.y, display.bounds.y);
      bounds.width = Math.max(bounds.width, display.bounds.x + display.bounds.width);
      bounds.height = Math.max(bounds.height, display.bounds.y + display.bounds.height);
      return bounds;
    },
    { x: 0, y: 0, width: 0, height: 0 }
  );

  notificationWindow.setBounds(totalBounds);

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
    title: "Activity Update",
    message: title,
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
        breakTimer = setTimeout(
          () => {
            showNotification(
              "Time for a Break",
              "It's been 15 minutes since you requested a break. Would you like to take it now?"
            );
            breakTimer = null;
          },
          15 * 60 * 1000
        ); // 15 minutes in milliseconds
        break;
    }

    // Hide the window after dialog is closed
    if (notificationWindow && !notificationWindow.isDestroyed()) {
      notificationWindow.hide();
    }
  });
}

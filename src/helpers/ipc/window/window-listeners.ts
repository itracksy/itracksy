import { BrowserWindow, app, dialog, ipcMain, screen } from "electron";
import {
  WIN_CLEAR_ACTIVITIES_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_GET_ACTIVITIES_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
} from "./window-channels";

import { ActivityRecord } from "@/types/activity";
import { safelyRegisterListener } from "../safelyRegisterListener";
import { addActivity, getActivities, clearActivities } from "../../../services/ActivityStorage";
import { TRACKING_INTERVAL } from "../../../config/tracking";

let trackingIntervalId: NodeJS.Timeout | null = null;
let mainWindowRef: BrowserWindow | null = null;
let notificationWindow: BrowserWindow | null = null;
let breakTimer: NodeJS.Timeout | null = null;
let lastNotificationTime: number = 0;
let isNotificationEnabled: boolean = true;

const NOTIFICATION_COOLDOWN = 60 * 1000; // 1 minute in milliseconds

export const addWindowEventListeners = (mainWindow: BrowserWindow) => {
  mainWindowRef = mainWindow;

  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });

  safelyRegisterListener(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  safelyRegisterListener(WIN_CLOSE_CHANNEL, () => {
    mainWindow.close();
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
      }
    ) => {
      return await startTracking(params);
    }
  );
  safelyRegisterListener(WIN_STOP_TRACKING_CHANNEL, () => {
    stopTracking();
  });
  safelyRegisterListener(WIN_CLEAR_ACTIVITIES_CHANNEL, async () => {
    return await clearActivities();
  });
  safelyRegisterListener(WIN_GET_ACTIVITIES_CHANNEL, async () => {
    return await getActivities();
  });
};

const startTracking = async (params: {
  accessibilityPermission: boolean;
  screenRecordingPermission: boolean;
  blockedDomains: string[];
  blockedApps: string[];
}): Promise<void> => {
  console.log("Window: Calling startTracking", params);

  // Clear any existing interval
  stopTracking();

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    const getWindows = await import("get-windows");
    const result = await getWindows.activeWindow(params);

    if (result) {
      const transformedActivities: ActivityRecord = {
        platform: result.platform,
        id: result.id,
        title: result.title,
        ownerPath: result.owner.path,
        ownerProcessId: result.owner.processId,
        ownerName: result.owner.name,
        timestamp: Date.now(),
        count: 1,
        //@ts-ignore
        url: result.url,
      };

      await addActivity(transformedActivities);
      const url = transformedActivities.url;
      const appName = transformedActivities.ownerName;
      // Show notification in full-screen window
      if (
        ((url && params.blockedDomains.some((domain) => url.includes(domain))) ||
          (appName &&
            params.blockedApps.some((app) => appName.toLowerCase().includes(app.toLowerCase())))) &&
        isNotificationEnabled &&
        Date.now() - lastNotificationTime >= NOTIFICATION_COOLDOWN
      ) {
        showNotification(transformedActivities.title, transformedActivities.ownerPath || "");
      }
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

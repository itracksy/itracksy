import { BrowserWindow, ipcMain } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
} from "./window-channels";

import { ActivityRecord } from "@/types/activity";

export const addWindowEventListeners = (mainWindow: BrowserWindow) => {
  console.log("[Window Listeners] Initializing window event listeners...", ipcMain);

  ipcMain.handle(WIN_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(WIN_CLOSE_CHANNEL, () => {
    mainWindow.close();
  });
  ipcMain.handle(
    WIN_START_TRACKING_CHANNEL,
    async (_, params: { accessibilityPermission: true; screenRecordingPermission: true }) => {
      return await startTracking(params);
    }
  );
};

const startTracking = async ({
  accessibilityPermission,
  screenRecordingPermission,
}: {
  accessibilityPermission: true;
  screenRecordingPermission: true;
}): Promise<ActivityRecord | undefined> => {
  const getWindows = await import("get-windows");
  const result = await getWindows.activeWindow({
    accessibilityPermission: accessibilityPermission,
    screenRecordingPermission: screenRecordingPermission,
  });

  if (result) {
    if (result.platform === "macos") {
      console.log(
        `ActivityTracker: Active window - ${result.title} (Bundle ID: ${result.owner.bundleId})`
      );
    } else {
      console.log(`ActivityTracker: Active window - ${result.title} (Path: ${result.owner.path})`);
    }

    const activityRecord: ActivityRecord = {
      ...result,
      timestamp: Date.now(),
    };
    return activityRecord;
  }
};

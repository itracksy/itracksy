import { BrowserWindow, ipcMain } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
} from "./window-channels";

import { ActivityRecord } from "@/types/activity";

export const addWindowEventListeners = (mainWindow: BrowserWindow) => {
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
    async (_, params: { accessibilityPermission: boolean; screenRecordingPermission: boolean }) => {
      return await startTracking(params);
    }
  );
};

const startTracking = async (params: {
  accessibilityPermission: boolean;
  screenRecordingPermission: boolean;
}): Promise<ActivityRecord | undefined> => {
  console.log("Window: Calling startTracking", params);

  const getWindows = await import("get-windows");
  const result = await getWindows.activeWindow(params);

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

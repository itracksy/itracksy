import { BrowserWindow } from "electron";
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

export const addWindowEventListeners = (mainWindow: BrowserWindow) => {
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
    async (_, params: { accessibilityPermission: boolean; screenRecordingPermission: boolean }) => {
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
}): Promise<void> => {
  console.log("Window: Calling startTracking", params);

  // Clear any existing interval
  stopTracking();

  // Start the interval
  trackingIntervalId = setInterval(async () => {
    const getWindows = await import("get-windows");
    const result = await getWindows.activeWindow(params);

    if (result) {
      console.log(`ActivityTracker: Active window:`, result);

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
    }
  }, TRACKING_INTERVAL);
};

const stopTracking = (): void => {
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }
};

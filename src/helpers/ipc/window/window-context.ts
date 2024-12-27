import { contextBridge, ipcRenderer } from "electron";
import {
  WIN_MINIMIZE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_GET_ACTIVE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_CLEAR_ACTIVITY_DATA_CHANNEL,
  WIN_GET_TRACKING_STATE_CHANNEL,
} from "./window-channels";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),

    getActiveWindow: async () => {
      const result = await ipcRenderer.invoke(WIN_GET_ACTIVE_CHANNEL);

      return result;
    },

    startTracking: async (params: {
      accessibilityPermission: true;
      screenRecordingPermission: true;
    }) => {
      const result = await ipcRenderer.invoke(WIN_START_TRACKING_CHANNEL, params);
      return result;
    },
    stopTracking: async () => {
      console.log("Window: Calling stopTracking");
      const result = await ipcRenderer.invoke(WIN_STOP_TRACKING_CHANNEL);
      console.log("Window: stopTracking result:", result);
      return result;
    },
    clearActivityData: async () => {
      console.log("Window: Calling clearActivityData");
      const result = await ipcRenderer.invoke(WIN_CLEAR_ACTIVITY_DATA_CHANNEL);
      console.log("Window: clearActivityData result:", result);
      return result;
    },
    getTrackingState: async () => {
      console.log("Window: Calling getTrackingState");
      const result = await ipcRenderer.invoke(WIN_GET_TRACKING_STATE_CHANNEL);
      console.log("Window: getTrackingState result:", result);
      return result;
    },
  });
}

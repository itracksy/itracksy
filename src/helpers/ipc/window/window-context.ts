import { contextBridge, ipcRenderer } from "electron";
import {
  WIN_MINIMIZE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_GET_ACTIVITIES_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_CLEAR_ACTIVITIES_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
} from "./window-channels";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),
    updateTrayTitle: (title: string) => ipcRenderer.invoke(WIN_UPDATE_TRAY_TITLE_CHANNEL, title),

    startTracking: async (params: {
      accessibilityPermission: true;
      screenRecordingPermission: true;
      blockedDomains: string[];
      blockedApps: string[];
      isFocusMode: boolean;
    }) => {
      ipcRenderer.invoke(WIN_START_TRACKING_CHANNEL, params);
    },
    stopTracking: async () => {
      await ipcRenderer.invoke(WIN_STOP_TRACKING_CHANNEL);
    },
    clearActivities: async () => {
      return await ipcRenderer.invoke(WIN_CLEAR_ACTIVITIES_CHANNEL);
    },
    getActivities: async () => {
      return await ipcRenderer.invoke(WIN_GET_ACTIVITIES_CHANNEL);
    },
  });
}

import { contextBridge, ipcRenderer } from "electron";
import {
  WIN_MINIMIZE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_GET_APP_VERSION_CHANNEL,
  WIN_CHECK_UPDATES_CHANNEL,
  WIN_GET_LOG_FILE_CONTENT_CHANNEL,
} from "./window-channels";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),
    updateTrayTitle: (title: string) => ipcRenderer.invoke(WIN_UPDATE_TRAY_TITLE_CHANNEL, title),

    getAppVersion: async () => {
      return ipcRenderer.invoke(WIN_GET_APP_VERSION_CHANNEL);
    },
    checkForUpdates: async () => {
      return ipcRenderer.invoke(WIN_CHECK_UPDATES_CHANNEL);
    },
    getLogFileContent: async () => {
      return ipcRenderer.invoke(WIN_GET_LOG_FILE_CONTENT_CHANNEL);
    },
  });
}

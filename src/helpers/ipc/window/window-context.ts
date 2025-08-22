import { contextBridge, ipcRenderer } from "electron";
import {
  WIN_MINIMIZE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_CLOSE_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL,
} from "./window-channels";

export function exposeWindowContext() {
  contextBridge.exposeInMainWorld("electronWindow", {
    minimize: () => ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL),
    maximize: () => ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL),
    close: () => ipcRenderer.invoke(WIN_CLOSE_CHANNEL),
    updateTrayTitle: (title: string) => ipcRenderer.invoke(WIN_UPDATE_TRAY_TITLE_CHANNEL, title),
    handleClockVisibilityChange: (isVisible: boolean) =>
      ipcRenderer.invoke(WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL, isVisible),
  });
}

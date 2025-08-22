import {
  CLOCK_CONTROL_CHANNEL,
  CLOCK_HIDE_CHANNEL,
  CLOCK_UPDATE_CHANNEL,
  CLOCK_SHOW_CHANNEL,
  CLOCK_SHOW_MAIN_CHANNEL,
} from "@/helpers/ipc/clock/clock-channels";
import { contextBridge, ipcRenderer } from "electron";

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronClock", {
  // Function to control timer (start/pause/stop)
  control: (action: string, data?: any) => {
    return ipcRenderer.invoke(CLOCK_CONTROL_CHANNEL, { action, data });
  },

  // Function to hide the clock window
  hide: () => {
    return ipcRenderer.invoke(CLOCK_HIDE_CHANNEL);
  },

  // Function to show the main window
  showMain: () => {
    return ipcRenderer.invoke(CLOCK_SHOW_MAIN_CHANNEL);
  },

  // Function to listen for timer updates
  onUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on(CLOCK_UPDATE_CHANNEL, (_event, data) => {
      callback(data);
    });
  },

  // Function to listen for show events
  onShow: (callback: () => void) => {
    ipcRenderer.on(CLOCK_SHOW_CHANNEL, () => {
      callback();
    });
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners(CLOCK_UPDATE_CHANNEL);
    ipcRenderer.removeAllListeners(CLOCK_SHOW_CHANNEL);
  },
});

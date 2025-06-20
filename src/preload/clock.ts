import {
  CLOCK_CONTROL_CHANNEL,
  CLOCK_HIDE_CHANNEL,
  CLOCK_UPDATE_CHANNEL,
  CLOCK_SHOW_CHANNEL,
  CLOCK_SHOW_MAIN_CHANNEL,
} from "@/helpers/ipc/clock/clock-channels";
import { contextBridge, ipcRenderer } from "electron";

console.log("Clock preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronClock", {
  // Function to control timer (start/pause/stop)
  control: (action: string, data?: any) => {
    console.log("Sending clock control:", action, data);
    return ipcRenderer.invoke(CLOCK_CONTROL_CHANNEL, { action, data });
  },

  // Function to hide the clock window
  hide: () => {
    console.log("Hiding clock window");
    return ipcRenderer.invoke(CLOCK_HIDE_CHANNEL);
  },

  // Function to show the main window
  showMain: () => {
    console.log("Showing main window");
    return ipcRenderer.invoke(CLOCK_SHOW_MAIN_CHANNEL);
  },

  // Function to listen for timer updates
  onUpdate: (callback: (data: any) => void) => {
    console.log("Setting up clock update listener");
    ipcRenderer.on(CLOCK_UPDATE_CHANNEL, (_event, data) => {
      console.log("Received clock update event", data);
      callback(data);
    });
  },

  // Function to listen for show events
  onShow: (callback: () => void) => {
    console.log("Setting up clock show listener");
    ipcRenderer.on(CLOCK_SHOW_CHANNEL, () => {
      console.log("Received clock show event");
      callback();
    });
  },

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners(CLOCK_UPDATE_CHANNEL);
    ipcRenderer.removeAllListeners(CLOCK_SHOW_CHANNEL);
  },
});

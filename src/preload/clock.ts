import { contextBridge, ipcRenderer } from "electron";

// Clock specific channels
const CLOCK_SHOW_CHANNEL = "show-clock";
const CLOCK_HIDE_CHANNEL = "hide-clock";
const CLOCK_UPDATE_CHANNEL = "clock-update";
const CLOCK_CONTROL_CHANNEL = "clock-control";
const CLOCK_SETTINGS_CHANNEL = "clock-settings";

console.log("Clock preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronClock", {
  // Function to control timer (start/pause/stop)
  control: (action: string, data?: any) => {
    console.log("Sending clock control:", action, data);
    return ipcRenderer.invoke(CLOCK_CONTROL_CHANNEL, { action, data });
  },

  // Function to access settings
  openSettings: () => {
    console.log("Opening settings from clock");
    return ipcRenderer.invoke(CLOCK_SETTINGS_CHANNEL);
  },

  // Function to hide the clock window
  hide: () => {
    console.log("Hiding clock window");
    return ipcRenderer.invoke(CLOCK_HIDE_CHANNEL);
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

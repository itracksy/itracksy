import { contextBridge, ipcRenderer } from "electron";

// Add debug logging to preload script
console.log("Notification preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Function to close the notification window
  closeNotification: () => {
    console.log("Sending close-notification event");
    ipcRenderer.send("close-notification");
  },

  // Function to handle notification action
  notificationAction: () => {
    console.log("Sending notification-action event");
    ipcRenderer.send("notification-action");
  },

  // Function to listen for show-notification events
  onNotification: (callback: (data: any) => void) => {
    ipcRenderer.on("show-notification", (_event, data) => {
      console.log("Received show-notification event", data);
      callback(data);
    });
  },
});

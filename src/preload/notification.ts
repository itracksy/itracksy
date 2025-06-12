import { contextBridge, ipcRenderer } from "electron";
import {
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
} from "../helpers/ipc/notification/notification-channels";

// Add debug logging to preload script
console.log("Notification preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Function to close the notification window
  closeNotification: () => {
    console.log("Sending close-notification event");
    ipcRenderer.invoke(NOTIFICATION_CLOSE_CHANNEL);
  },

  // Function to handle notification action
  notificationAction: () => {
    console.log("Sending notification-action event");
    ipcRenderer.invoke(NOTIFICATION_ACTION_CHANNEL);
  },

  // Function to listen for show-notification events
  onNotification: (callback: (data: any) => void) => {
    ipcRenderer.on("show-notification", (_event, data) => {
      console.log("Received show-notification event", data);
      callback(data);
    });
  },
});

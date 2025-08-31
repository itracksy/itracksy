import { contextBridge, ipcRenderer } from "electron";
import {
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
  NOTIFICATION_EXTEND_SESSION_CHANNEL,
} from "../helpers/ipc/notification/notification-channels";

// Add debug logging to preload script
console.log("Notification preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronNotification", {
  // Function to close the notification window
  close: async () => {
    console.log("Sending close-notification event");
    try {
      await ipcRenderer.invoke(NOTIFICATION_CLOSE_CHANNEL);
      console.log("Close notification request sent successfully");
    } catch (error) {
      console.error("Failed to close notification:", error);
    }
  },

  // Function to handle notification action
  action: () => {
    console.log("Sending notification-action event");
    ipcRenderer.invoke(NOTIFICATION_ACTION_CHANNEL);
  },

  // Function to extend session
  extendSession: (minutesToAdd: number) => {
    console.log("Extending session by", minutesToAdd, "minutes");
    return ipcRenderer.invoke(NOTIFICATION_EXTEND_SESSION_CHANNEL, { minutesToAdd });
  },

  // Function to listen for show-notification events
  onNotification: (callback: (data: any) => void) => {
    ipcRenderer.on(NOTIFICATION_SHOW_CHANNEL, (_event, data) => {
      console.log("Received show-notification event", data);
      callback(data);
    });
  },
});

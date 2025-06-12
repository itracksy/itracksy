import { contextBridge, ipcRenderer } from "electron";
import {
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
} from "./notification-channels";

export function exposeNotificationContext() {
  contextBridge.exposeInMainWorld("electronNotification", {
    // Function to send a notification
    send: (data: any) => {
      console.log("Sending notification:", data);
      return ipcRenderer.invoke(NOTIFICATION_SEND_CHANNEL, data);
    },

    // Function to close the notification window
    close: () => {
      console.log("Closing notification");
      return ipcRenderer.invoke(NOTIFICATION_CLOSE_CHANNEL);
    },

    // Function to handle notification action
    action: () => {
      console.log("Notification action triggered");
      return ipcRenderer.invoke(NOTIFICATION_ACTION_CHANNEL);
    },

    // Function to listen for show-notification events
    onNotification: (callback: (data: any) => void) => {
      ipcRenderer.on(NOTIFICATION_SHOW_CHANNEL, (_event, data) => {
        console.log("Received show-notification event", data);
        callback(data);
      });
    },
  });
}

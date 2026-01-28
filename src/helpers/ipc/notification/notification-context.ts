import { contextBridge, ipcRenderer } from "electron";
import {
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
} from "./notification-channels";
import type { NotificationData } from "@/types/ipc";
import { logger } from "../../logger";

export function exposeNotificationContext() {
  contextBridge.exposeInMainWorld("electronNotification", {
    // Function to send a notification
    send: (data: NotificationData) => {
      logger.debug("Sending notification:", data);
      return ipcRenderer.invoke(NOTIFICATION_SEND_CHANNEL, data);
    },

    // Function to close the notification window
    close: () => {
      logger.debug("Closing notification");
      return ipcRenderer.invoke(NOTIFICATION_CLOSE_CHANNEL);
    },

    // Function to handle notification action
    action: () => {
      logger.debug("Notification action triggered");
      return ipcRenderer.invoke(NOTIFICATION_ACTION_CHANNEL);
    },

    // Function to listen for show-notification events
    onNotification: (callback: (data: NotificationData) => void) => {
      ipcRenderer.on(NOTIFICATION_SHOW_CHANNEL, (_event, data: NotificationData) => {
        logger.debug("Received show-notification event", data);
        callback(data);
      });
    },
  });
}

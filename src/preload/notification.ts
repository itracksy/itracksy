import { contextBridge, ipcRenderer } from "electron";
import {
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
  NOTIFICATION_SHOW_CHANNEL,
  NOTIFICATION_EXTEND_SESSION_CHANNEL,
  NOTIFICATION_READY_CHANNEL,
} from "../helpers/ipc/notification/notification-channels";
import type { NotificationData } from "@/types/ipc";

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronNotification", {
  // Function to close the notification window
  close: async () => {
    await ipcRenderer.invoke(NOTIFICATION_CLOSE_CHANNEL);
  },

  // Function to handle notification action
  action: () => {
    ipcRenderer.invoke(NOTIFICATION_ACTION_CHANNEL);
  },

  // Function to extend session
  extendSession: (minutesToAdd: number) => {
    return ipcRenderer.invoke(NOTIFICATION_EXTEND_SESSION_CHANNEL, { minutesToAdd });
  },

  // Function to notify main process that renderer is ready to show
  notifyReady: () => {
    ipcRenderer.send(NOTIFICATION_READY_CHANNEL);
  },

  // Function to listen for show-notification events
  onNotification: (callback: (data: NotificationData) => void) => {
    ipcRenderer.on(NOTIFICATION_SHOW_CHANNEL, (_event, data: NotificationData) => {
      callback(data);
    });
  },
});

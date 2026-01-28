import { contextBridge, ipcRenderer } from "electron";
import type { BlockingNotificationData } from "@/types/ipc";

// Blocking notification specific channels
const BLOCKING_NOTIFICATION_SHOW_CHANNEL = "show-blocking-notification";
const BLOCKING_NOTIFICATION_RESPOND_CHANNEL = "blocking-notification-respond";
const BLOCKING_NOTIFICATION_CLOSE_CHANNEL = "close-blocking-notification";

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronBlockingNotification", {
  // Function to handle notification response
  respond: (response: number) => {
    return ipcRenderer.invoke(BLOCKING_NOTIFICATION_RESPOND_CHANNEL, response);
  },

  // Function to explicitly close the notification window
  close: () => {
    return ipcRenderer.invoke(BLOCKING_NOTIFICATION_CLOSE_CHANNEL);
  },

  // Function to open main window and navigate to a specific route
  openMainWindow: (route?: string) => {
    return ipcRenderer.invoke("open-main-window", route);
  },

  // Function to listen for show-blocking-notification events
  onNotification: (callback: (data: BlockingNotificationData) => void) => {
    ipcRenderer.on(BLOCKING_NOTIFICATION_SHOW_CHANNEL, (_event, data: BlockingNotificationData) => {
      callback(data);
    });

    // Also listen for trigger-close events from the main process
    ipcRenderer.on("trigger-close", () => {
      ipcRenderer.invoke(BLOCKING_NOTIFICATION_CLOSE_CHANNEL).catch(() => {
        // Error handling trigger-close silently
      });
    });
  },
});

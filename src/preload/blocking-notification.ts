import { contextBridge, ipcRenderer } from "electron";

// Blocking notification specific channels
const BLOCKING_NOTIFICATION_SHOW_CHANNEL = "show-blocking-notification";
const BLOCKING_NOTIFICATION_RESPOND_CHANNEL = "blocking-notification-respond";
const BLOCKING_NOTIFICATION_CLOSE_CHANNEL = "close-blocking-notification";

console.log("Blocking notification preload script initializing");

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld("electronBlockingNotification", {
  // Function to handle notification response
  respond: (response: number) => {
    console.log("Sending blocking notification response:", response);
    return ipcRenderer.invoke(BLOCKING_NOTIFICATION_RESPOND_CHANNEL, response);
  },

  // Function to explicitly close the notification window
  close: () => {
    console.log("Sending blocking notification close request");
    return ipcRenderer.invoke(BLOCKING_NOTIFICATION_CLOSE_CHANNEL);
  },

  // Function to listen for show-blocking-notification events
  onNotification: (callback: (data: any) => void) => {
    console.log("Setting up blocking notification listener");
    ipcRenderer.on(BLOCKING_NOTIFICATION_SHOW_CHANNEL, (_event, data) => {
      console.log("Received show-blocking-notification event", data);
      callback(data);
    });

    // Also listen for trigger-close events from the main process
    ipcRenderer.on("trigger-close", () => {
      console.log("Received trigger-close event");
      ipcRenderer.invoke(BLOCKING_NOTIFICATION_CLOSE_CHANNEL).catch((err) => {
        console.error("Error handling trigger-close:", err);
      });
    });
  },
});

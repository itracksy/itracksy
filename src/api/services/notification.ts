import { NotificationOptions } from "@/types/notification";
import { logger } from "../../helpers/logger";
import { Notification, BrowserWindow } from "electron";

export const sendSystemNotification = async (options: NotificationOptions) => {
  try {
    // Check if notifications are supported
    if (!Notification.isSupported()) {
      logger.warn("System notifications are not supported on this platform");
      return false;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent,
      icon: "./resources/icon.png",
      timeoutType: options.requireInteraction ? "never" : "default",
    });

    // Handle notification click
    notification.on("click", () => {
      // Focus the main window
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    if (options.timeoutMs) {
      setTimeout(() => notification.show(), options.timeoutMs);
    } else {
      notification.show();
    }

    return true;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
};

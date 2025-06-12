import { ipcMain } from "electron";
import {
  NOTIFICATION_SEND_CHANNEL,
  NOTIFICATION_CLOSE_CHANNEL,
  NOTIFICATION_ACTION_CHANNEL,
} from "./notification-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";
import {
  createNotificationWindow,
  getNotificationWindow,
} from "../../../main/windows/notification";
import { logger } from "../../logger";

export const addNotificationEventListeners = () => {
  logger.debug("NotificationListeners: Adding notification listeners");

  // Send notification handler
  safelyRegisterListener(NOTIFICATION_SEND_CHANNEL, (_event, data) => {
    try {
      logger.debug("Notification requested", data);
      const notificationWindow = createNotificationWindow();
      notificationWindow.webContents.send("show-notification", data);
    } catch (error) {
      logger.error("Failed to send notification", { error, data });
    }
  });

  // Close notification handler
  safelyRegisterListener(NOTIFICATION_CLOSE_CHANNEL, () => {
    try {
      logger.debug("Closing notification window");
      const notificationWindow = getNotificationWindow();
      if (notificationWindow) {
        notificationWindow.close();
      }
    } catch (error) {
      logger.error("Failed to close notification window", { error });
    }
  });

  // Notification action handler
  safelyRegisterListener(NOTIFICATION_ACTION_CHANNEL, () => {
    try {
      logger.debug("Notification action triggered");
      // You can add custom action handling here
    } catch (error) {
      logger.error("Failed to handle notification action", { error });
    }
  });
};

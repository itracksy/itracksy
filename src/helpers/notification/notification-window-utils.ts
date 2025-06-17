import { createNotificationWindow } from "../../main/windows/notification";
import { NOTIFICATION_SHOW_CHANNEL } from "../ipc/notification/notification-channels";
import { logger } from "../logger";

export interface NotificationAction {
  label: string;
  action: () => Promise<void>;
}

export interface NotificationData {
  title: string;
  body: string;
  autoDismiss?: boolean; // Default is false (turn off auto dismiss)
  actions?: NotificationAction[];
}

/**
 * Sends notification data to the custom notification window.
 * Handles window creation, loading state, and IPC communication.
 *
 * @param data - The notification data to send
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const sendNotificationToWindow = async (data: NotificationData): Promise<boolean> => {
  try {
    logger.debug("Sending notification to window", data);

    const notificationWindow = createNotificationWindow();

    // Wait for the window to be ready before sending the message
    if (notificationWindow.webContents.isLoading()) {
      notificationWindow.webContents.once("did-finish-load", () => {
        notificationWindow.webContents.send(NOTIFICATION_SHOW_CHANNEL, data);
      });
    } else {
      notificationWindow.webContents.send(NOTIFICATION_SHOW_CHANNEL, data);
    }

    return true;
  } catch (error) {
    logger.error("Failed to send notification to window", { error, data });
    return false;
  }
};

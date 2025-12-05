import { createNotificationWindow, showNotificationWindow } from "../../main/windows/notification";
import { NOTIFICATION_SHOW_CHANNEL } from "../ipc/notification/notification-channels";
import { logger } from "../logger";

export interface NotificationAction {
  label: string;
  action: () => Promise<void>;
  variant?: "primary" | "secondary" | "success" | "warning"; // For styling
}

export interface NotificationData {
  title: string;
  body: string;
  autoDismiss?: boolean; // Default is false (turn off auto dismiss)
  actions?: NotificationAction[];
  sessionEndTime?: number; // Timestamp when session ends (for countdown)
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
        // Give renderer a moment to process and render the notification content
        setTimeout(() => {
          showNotificationWindow();
        }, 100);
      });
    } else {
      notificationWindow.webContents.send(NOTIFICATION_SHOW_CHANNEL, data);
      // Give renderer a moment to process and render the notification content
      // This prevents showing an empty window before content is rendered
      setTimeout(() => {
        showNotificationWindow();
      }, 100);
    }

    return true;
  } catch (error) {
    logger.error("Failed to send notification to window", { error, data });
    return false;
  }
};

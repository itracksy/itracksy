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
    logger.info("[NotificationWindow] Sending notification to window", {
      title: data.title,
      hasActions: !!data.actions,
      autoDismiss: data.autoDismiss,
    });

    const notificationWindow = createNotificationWindow();
    const isLoading = notificationWindow.webContents.isLoading();
    const isVisible = notificationWindow.isVisible();
    const bounds = notificationWindow.getBounds();

    logger.info("[NotificationWindow] Window state before send", {
      isLoading,
      isVisible,
      bounds,
      windowId: notificationWindow.id,
    });

    // Wait for the window to be ready before sending the message
    if (isLoading) {
      logger.info("[NotificationWindow] Window is loading, waiting for did-finish-load");
      notificationWindow.webContents.once("did-finish-load", () => {
        logger.info("[NotificationWindow] Window loaded, sending IPC message");
        notificationWindow.webContents.send(NOTIFICATION_SHOW_CHANNEL, data);
        logger.info(
          "[NotificationWindow] IPC message sent, renderer will notify when ready to show"
        );
      });
    } else {
      logger.info("[NotificationWindow] Window already loaded, sending IPC message immediately");
      notificationWindow.webContents.send(NOTIFICATION_SHOW_CHANNEL, data);
      logger.info("[NotificationWindow] IPC message sent, renderer will notify when ready to show");
    }

    return true;
  } catch (error) {
    logger.error("[NotificationWindow] Failed to send notification to window", { error, data });
    return false;
  }
};

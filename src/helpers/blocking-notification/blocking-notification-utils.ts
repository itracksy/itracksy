import { createBlockingNotificationWindow } from "../../main/windows/blocking-notification";
import { BLOCKING_NOTIFICATION_SHOW_CHANNEL } from "../ipc/blocking-notification/blocking-notification-channels";
import { setCurrentResponseResolver } from "../ipc/blocking-notification/blocking-notification-listeners";
import { logger } from "../logger";

export interface BlockingNotificationData {
  title: string;
  detail: string;
  userId: string;
  timeEntryId: string;
  appOrDomain: string;
}

/**
 * Sends blocking notification data to the custom blocking notification window.
 * This replaces the native dialog.showMessageBox with a custom HTML UI.
 *
 * @param data - The blocking notification data to send
 * @returns Promise that resolves to the user's response (0, 1, 2, or -1 for cancelled)
 */
export const sendBlockingNotificationToWindow = async (
  data: BlockingNotificationData
): Promise<number> => {
  try {
    logger.debug("Sending blocking notification to window", data);

    const blockingNotificationWindow = createBlockingNotificationWindow();

    // Create a promise that will be resolved when the user responds
    const responsePromise = new Promise<number>((resolve) => {
      setCurrentResponseResolver(resolve);
    });

    // Wait for the window to be ready before sending the message
    if (blockingNotificationWindow.webContents.isLoading()) {
      blockingNotificationWindow.webContents.once("did-finish-load", () => {
        blockingNotificationWindow.webContents.send(BLOCKING_NOTIFICATION_SHOW_CHANNEL, data);
        blockingNotificationWindow.show();
        blockingNotificationWindow.focus();
        blockingNotificationWindow.moveTop();
      });
    } else {
      blockingNotificationWindow.webContents.send(BLOCKING_NOTIFICATION_SHOW_CHANNEL, data);
      blockingNotificationWindow.show();
      blockingNotificationWindow.focus();
      blockingNotificationWindow.moveTop();
    }

    // Wait for the user's response
    const response = await responsePromise;
    logger.debug("Blocking notification response received", { response });

    return response;
  } catch (error) {
    logger.error("Failed to send blocking notification to window", { error, data });
    return -1; // Return -1 to indicate error/cancellation
  }
};

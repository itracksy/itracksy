import {
  BLOCKING_NOTIFICATION_SHOW_CHANNEL,
  BLOCKING_NOTIFICATION_RESPOND_CHANNEL,
  BLOCKING_NOTIFICATION_CLOSE_CHANNEL,
} from "./blocking-notification-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";
import {
  getBlockingNotificationWindow,
  closeBlockingNotificationWindow,
} from "../../../main/windows/blocking-notification";
import { sendBlockingNotificationToWindow } from "../../blocking-notification/blocking-notification-utils";
import { logger } from "../../logger";

// Store the response resolver for the current blocking notification
let currentResponseResolver: ((value: number) => void) | null = null;

export const addBlockingNotificationEventListeners = () => {
  logger.debug("BlockingNotificationListeners: Adding blocking notification listeners");

  // Show blocking notification handler
  safelyRegisterListener(BLOCKING_NOTIFICATION_SHOW_CHANNEL, async (_event, data) => {
    try {
      logger.debug("Blocking notification requested", data);
      const response = await sendBlockingNotificationToWindow(data);
      return response;
    } catch (error) {
      logger.error("Failed to send blocking notification", { error, data });
      throw error;
    }
  });

  // Response handler
  safelyRegisterListener(
    BLOCKING_NOTIFICATION_RESPOND_CHANNEL,
    async (_event, response: number) => {
      try {
        logger.debug("Blocking notification response received", { response });

        if (currentResponseResolver) {
          currentResponseResolver(response);
          currentResponseResolver = null;
        }

        // Close the blocking notification window
        closeBlockingNotificationWindow();

        return { success: true };
      } catch (error) {
        logger.error("Failed to handle blocking notification response", { error, response });
        throw error;
      }
    }
  );

  // Close handler
  safelyRegisterListener(BLOCKING_NOTIFICATION_CLOSE_CHANNEL, async (_event) => {
    try {
      logger.debug("Blocking notification close requested");

      // Resolve with a special value (-1) to indicate the window was closed without a specific choice
      if (currentResponseResolver) {
        currentResponseResolver(-1);
        currentResponseResolver = null;
      }

      // Close the blocking notification window
      closeBlockingNotificationWindow();

      return { success: true };
    } catch (error) {
      logger.error("Failed to handle blocking notification close", { error });
      throw error;
    }
  });
};

export const setCurrentResponseResolver = (resolver: (value: number) => void) => {
  currentResponseResolver = resolver;
};

import { checkAndSendFocusReminder } from "./focusReminders";
import { getCurrentUserIdLocalStorage } from "./userSettings";
import { logger } from "../../helpers/logger";

let reminderInterval: NodeJS.Timeout | null = null;
const REMINDER_CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes

/**
 * Start the periodic focus reminder checker
 */
export function startFocusReminderService(): void {
  if (reminderInterval) {
    logger.warn("Focus reminder service is already running");
    return;
  }

  logger.info("Starting focus reminder service", {
    intervalMinutes: REMINDER_CHECK_INTERVAL / 60000,
  });

  reminderInterval = setInterval(async () => {
    try {
      const userId = await getCurrentUserIdLocalStorage();
      if (userId) {
        await checkAndSendFocusReminder(userId);
      }
    } catch (error) {
      logger.error("Error in focus reminder service", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, REMINDER_CHECK_INTERVAL);

  // Run once immediately
  setTimeout(async () => {
    try {
      const userId = await getCurrentUserIdLocalStorage();
      if (userId) {
        await checkAndSendFocusReminder(userId);
      }
    } catch (error) {
      logger.error("Error in initial focus reminder check", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, 5000); // Wait 5 seconds after startup
}

/**
 * Stop the periodic focus reminder checker
 */
export function stopFocusReminderService(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    logger.info("Focus reminder service stopped");
  }
}

/**
 * Check if the reminder service is running
 */
export function isReminderServiceRunning(): boolean {
  return reminderInterval !== null;
}

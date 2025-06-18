import { shouldSendReminder } from "./focusTargets";
import { sendNotification } from "./notification";
import { logger } from "../../helpers/logger";

/**
 * Check and send focus reminder if needed for a specific user
 */
export async function checkAndSendFocusReminder(userId: string): Promise<boolean> {
  try {
    const reminderCheck = await shouldSendReminder(userId);

    if (reminderCheck.shouldSend && reminderCheck.message) {
      await sendNotification(
        {
          title: "Focus Reminder",
          body: reminderCheck.message,
          type: "focus_reminder",
          userId,
          createdAt: Date.now(),
        },
        10000, // 10 seconds timeout
        true // auto dismiss
      );

      logger.info("Focus reminder sent", {
        userId,
        progress: reminderCheck.progress,
        message: reminderCheck.message,
      });

      return true;
    }

    return false;
  } catch (error) {
    logger.error("Failed to send focus reminder", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Send a motivational notification when user completes their daily target
 */
export async function sendTargetCompletedNotification(
  userId: string,
  targetMinutes: number
): Promise<void> {
  try {
    const congratsMessages = [
      `🎉 Congratulations! You've completed your ${targetMinutes}-minute focus goal for today!`,
      `🏆 Target achieved! You've successfully focused for ${targetMinutes} minutes today. Well done!`,
      `✨ Amazing! You've hit your daily focus target of ${targetMinutes} minutes. Keep up the great work!`,
      `🎯 Success! Your ${targetMinutes}-minute focus goal is complete. You're building great habits!`,
    ];

    const randomMessage = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];

    await sendNotification(
      {
        title: "🎉 Focus Target Achieved!",
        body: randomMessage,
        type: "target_completed",
        userId,
        createdAt: Date.now(),
      },
      15000, // 15 seconds timeout
      true // auto dismiss
    );

    logger.info("Target completion notification sent", {
      userId,
      targetMinutes,
      message: randomMessage,
    });
  } catch (error) {
    logger.error("Failed to send target completion notification", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Send encouragement when user starts their first focus session of the day
 */
export async function sendDailyStartNotification(
  userId: string,
  targetMinutes: number
): Promise<void> {
  try {
    const startMessages = [
      `🚀 Great start! You've begun working toward your ${targetMinutes}-minute focus goal today!`,
      `💪 Nice! Your focus journey for today has begun. ${targetMinutes} minutes is your target!`,
      `✨ Excellent! You've started your daily focus routine. Goal: ${targetMinutes} minutes!`,
      `🎯 Perfect timing! You're on track to achieve your ${targetMinutes}-minute focus target today!`,
    ];

    const randomMessage = startMessages[Math.floor(Math.random() * startMessages.length)];

    await sendNotification(
      {
        title: "🚀 Focus Session Started!",
        body: randomMessage,
        type: "daily_start",
        userId,
        createdAt: Date.now(),
      },
      8000, // 8 seconds timeout
      true // auto dismiss
    );

    logger.info("Daily start notification sent", {
      userId,
      targetMinutes,
      message: randomMessage,
    });
  } catch (error) {
    logger.error("Failed to send daily start notification", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import { NotificationOptions } from "@/types/notification";
import { logger } from "../../helpers/logger";
import { Notification, BrowserWindow } from "electron";
import { TimeEntryWithRelations } from "@/types/projects";
import { getLastWorkingTimeEntry, updateTimeEntry } from "./timeEntry";

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

const motivationalMessages = [
  "🎯 Ready for another productive session?",
  "⚡ Your last session was amazing! Keep the momentum going!",
  "🌟 Time to shine! Start your next focus session",
  "🚀 Launch into your next task with full focus!",
  "🎮 Level up your productivity - start a new session!",
  "🌈 Create some magic with another focus session!",
  "💪 You're on fire! Keep that productivity streak alive!",
  "🎨 Time to create something awesome!",
  "🎸 Rock your tasks with a new focus session!",
  "🌺 Fresh start, fresh mind - begin a new session!",
];

export const sendNotificationWhenNoActiveEntry = async (userId: string) => {
  const lastTimeEntry = await getLastWorkingTimeEntry(userId);

  if (!lastTimeEntry || lastTimeEntry.endTime) {
    return;
  }

  const now = new Date();
  const lastEndTime = new Date(lastTimeEntry.endTime!);
  const minutesSinceLastSession = Math.floor((now.getTime() - lastEndTime.getTime()) / (1000 * 60));

  // Only send notifications if:
  // 1. At least 30 minutes have passed since last session
  // 2. It's between 8 AM and 10 PM (respect user's likely working hours)
  // 3. Not sending notifications too frequently (at least 2 hours between notifications)
  if (
    minutesSinceLastSession >= 30 &&
    now.getHours() >= 8 &&
    now.getHours() < 22 &&
    minutesSinceLastSession % 120 === 0
  ) {
    // Pick a random motivational message
    const messageIndex = Math.floor(Math.random() * motivationalMessages.length);
    const message = motivationalMessages[messageIndex];

    // Calculate productivity stats to make the message more engaging
    const sessionDuration = Math.floor(
      (new Date(lastTimeEntry.endTime!).getTime() - new Date(lastTimeEntry.startTime).getTime()) /
        (1000 * 60)
    );

    // Get the task title, fallback to description or "your task" if neither exists
    const taskTitle = lastTimeEntry.item?.title || lastTimeEntry.description || "your task";

    await sendSystemNotification({
      title: "Time for a New Focus Session!",
      body: `${message}\n\nLast session: ${sessionDuration} minutes focused on "${taskTitle}" 🎯`,
      silent: false,
    });
  }
};

export const sendNotification = async (
  timeEntry: TimeEntryWithRelations,
  secondsExceeded: number
): Promise<void> => {
  if (!timeEntry.targetDuration) {
    return;
  }

  logger.debug("[sendNotification] Time exceeded (seconds)", {
    secondsExceeded,
    nextNotificationAt: getSecondsToSendNoti(timeEntry.notificationSentAt),
  });

  if (
    (timeEntry.notificationSentAt ?? 0) <= 3 &&
    secondsExceeded >= getSecondsToSendNoti(timeEntry.notificationSentAt)
  ) {
    const options = getNotificationOptions({
      timeEntry,
      minutesExceeded: Math.floor(secondsExceeded / 60),
    });

    try {
      sendSystemNotification(options);
      const notificationSentAt = (timeEntry.notificationSentAt ?? 0) + 1;
      logger.debug("[sendNotification] Updating notification count", { notificationSentAt });
      await updateTimeEntry(timeEntry.id, { notificationSentAt });
    } catch (error) {
      logger.error("[sendNotification] Failed to send or update notification", { error });
    }
  }
};

const getNotificationOptions = ({
  timeEntry,
  minutesExceeded,
}: {
  timeEntry: TimeEntryWithRelations;
  minutesExceeded: number;
}): NotificationOptions => {
  const sessionTitle = timeEntry.item?.title || timeEntry.description || "your session";

  // Fun messages for focus mode
  const focusMessages = [
    `Wow! You're on fire 🔥 ${minutesExceeded}min extra focus on "${sessionTitle}"! Time for a well-deserved break!`,
    `Super focused ninja! 🥷 ${minutesExceeded}min overtime on "${sessionTitle}". Let's recharge those brain cells!`,
    `You're crushing it! 💪 After ${minutesExceeded}min extra on "${sessionTitle}", how about a victory break?`,
    `Achievement unlocked: Ultra Focus! ⭐ ${minutesExceeded}min bonus on "${sessionTitle}". Time to celebrate with a break!`,
  ];

  // Fun messages for break mode
  const breakMessages = [
    `Epic break champion! 🏆 ${minutesExceeded}min extra chill. Ready to conquer work?`,
    `Break time high score: ${minutesExceeded}min! 🎮 Let's channel that energy into work!`,
    `Battery recharged 120%! ⚡ After ${minutesExceeded}min extra break, time to rock work!`,
    `Maximum relaxation achieved! 🌟 ${minutesExceeded}min bonus break. Work is calling!`,
  ];

  if (timeEntry.isFocusMode) {
    return {
      title: minutesExceeded > 0 ? "Super Focus Mode! 🚀" : "Focus Achievement Unlocked! ⭐",
      body:
        minutesExceeded > 0
          ? focusMessages[Math.floor(Math.random() * focusMessages.length)]
          : `Mission accomplished on "${sessionTitle}"! 🎉 You've crushed your focus goal! Time for a victory break!`,
      requireInteraction: true,
    };
  }

  return {
    title: minutesExceeded > 0 ? "Break Time Champion! 🏆" : "Break Time Complete! 🎯",
    body:
      minutesExceeded > 0
        ? breakMessages[Math.floor(Math.random() * breakMessages.length)]
        : `Break time complete! 🎉 Ready to tackle work with fresh energy?`,
    requireInteraction: true,
  };
};

function getSecondsToSendNoti(notificationSentAt: number | null): number {
  if (!notificationSentAt || notificationSentAt === 0) return 0;
  if (notificationSentAt === 1) return 2 * 60; // First reminder after 2 minutes
  if (notificationSentAt === 2) return 10 * 60; // Second reminder after 10 minutes
  if (notificationSentAt === 3) return 30 * 60; // Final reminder after 30 minutes

  return Number.MAX_SAFE_INTEGER;
}

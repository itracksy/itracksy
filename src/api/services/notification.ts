import { NotificationInsert } from "@/types/notification";
import { logger } from "../../helpers/logger";
import { Notification, BrowserWindow } from "electron";
import { TimeEntryWithRelations } from "@/types/projects";
import { getLastWorkingTimeEntry, updateTimeEntry } from "./timeEntry";

import { notifications } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";
import { getLastNotification } from "./notifications";
import { getTitleTimeEntry } from "../db/timeEntryExt";
import { sendNotificationToWindow } from "../../helpers/notification/notification-window-utils";

export const sendNotification = async (
  options: Omit<NotificationInsert, "id">,
  timeoutMs?: number,
  autoDismiss?: boolean
) => {
  try {
    // Store notification in database
    await db.insert(notifications).values({
      ...options,
      id: nanoid(),
    });

    // Use custom notification window instead of native OS notifications
    const success = await sendNotificationToWindow({
      title: options.title,
      body: options.body,
      autoDismiss: autoDismiss ?? false, // Default is false (no auto dismiss)
    });

    return success;
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
  const lastNotification = await getLastNotification(userId, "remind_last_time_entry");
  const now = new Date();
  const isTimeToWork = now.getHours() >= 8 && now.getHours() < 22;
  if (!isTimeToWork) {
    return;
  }
  if (!lastTimeEntry) {
    return;
  }
  if (!lastTimeEntry.endTime) {
    return;
  }

  const sessionMinutesDuration = Math.round((now.getTime() - lastTimeEntry.startTime) / 1000 / 60);
  const taskTitle = getTitleTimeEntry(lastTimeEntry);

  const minutesSinceLastSession = Math.floor((now.getTime() - lastTimeEntry.endTime) / (1000 * 60));

  if (minutesSinceLastSession < 30) {
    return;
  }

  // Don't send notification if last one was sent less than 2 hours ago
  if (lastNotification && Date.now() - lastNotification.createdAt < 2 * 60 * 60 * 1000) {
    return;
  }

  const messages = motivationalMessages;
  const message = messages[Math.floor(Math.random() * messages.length)];

  if (message) {
    await sendNotification(
      {
        title: "Time for a New Focus Session!",
        body: `${message}\n\nLast session: ${sessionMinutesDuration} minutes focused on "${taskTitle}" 🎯`,
        userId: userId,
        type: "remind_last_time_entry",
        timeEntryId: lastTimeEntry.id,
        createdAt: Date.now(),
      },
      undefined,
      true
    ); // Enable auto-dismiss for motivational messages
  }
};

export const sendNotificationService = async (
  timeEntry: TimeEntryWithRelations,
  secondsExceeded: number
): Promise<void> => {
  if (!timeEntry.targetDuration) {
    return;
  }

  if (
    (timeEntry.notificationSentAt ?? 0) <= 3 &&
    secondsExceeded >= getSecondsToSendNoti(timeEntry.notificationSentAt)
  ) {
    const { title, body } = getNotificationOptions({
      timeEntry,
      minutesExceeded: Math.floor(secondsExceeded / 60),
    });

    try {
      sendNotification(
        {
          title,
          body,
          userId: timeEntry.userId,
          type: "engagement_time_entry",
          timeEntryId: timeEntry.id,
          createdAt: Date.now(),
        },
        undefined,
        false
      ); // Keep engagement notifications persistent (no auto-dismiss)
      const notificationSentAt = (timeEntry.notificationSentAt ?? 0) + 1;

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
}): { title: string; body: string } => {
  const sessionTitle = getTitleTimeEntry(timeEntry);

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
    };
  }

  return {
    title: minutesExceeded > 0 ? "Break Time Champion! 🏆" : "Break Time Complete! 🎯",
    body:
      minutesExceeded > 0
        ? breakMessages[Math.floor(Math.random() * breakMessages.length)]
        : `Break time complete! 🎉 Ready to tackle work with fresh energy?`,
  };
};

function getSecondsToSendNoti(notificationSentAt: number | null): number {
  if (!notificationSentAt || notificationSentAt === 0) return 0;
  if (notificationSentAt === 1) return 2 * 60; // First reminder after 2 minutes
  if (notificationSentAt === 2) return 10 * 60; // Second reminder after 10 minutes
  if (notificationSentAt === 3) return 30 * 60; // Final reminder after 30 minutes

  return Number.MAX_SAFE_INTEGER;
}

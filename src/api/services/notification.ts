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
import { getUserPreferences } from "./userSettings";

export const sendNotification = async (
  options: Omit<NotificationInsert, "id"> & {
    sessionEndTime?: number;
    actions?: Array<{
      label: string;
      action: () => Promise<void>;
      variant?: "primary" | "secondary" | "success" | "warning";
    }>;
    skipPreferenceCheck?: boolean; // For critical notifications that should always show
  },
  timeoutMs?: number,
  autoDismiss?: boolean
) => {
  try {
    // Check user preferences for notifications (unless skipPreferenceCheck is true)
    if (!options.skipPreferenceCheck) {
      const preferences = await getUserPreferences();
      if (!preferences.notifications.showDesktopNotifications) {
        logger.debug("[sendNotification] Desktop notifications disabled by user preference");
        return false;
      }
    }

    // Store notification in database (exclude sessionEndTime, actions, and skipPreferenceCheck as they're UI-only)
    const { sessionEndTime, actions, skipPreferenceCheck, ...dbOptions } = options;
    await db.insert(notifications).values({
      ...dbOptions,
      id: nanoid(),
    });

    // Use custom notification window instead of native OS notifications
    const success = await sendNotificationToWindow({
      title: options.title,
      body: options.body,
      autoDismiss: autoDismiss ?? false, // Default is false (no auto dismiss)
      sessionEndTime: options.sessionEndTime, // Pass through session end time if available
      actions: options.actions, // Pass through actions if available
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
  // Check if focus reminders are enabled in user preferences
  const preferences = await getUserPreferences();
  if (!preferences.notifications.focusReminders) {
    logger.debug("[sendNotificationWhenNoActiveEntry] Focus reminders disabled by user preference");
    return;
  }

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
  secondsRemaining: number
): Promise<void> => {
  if (!timeEntry.targetDuration) {
    return;
  }

  // Check appropriate preference based on session type
  const preferences = await getUserPreferences();
  const preferenceKey = timeEntry.isFocusMode ? "focusReminders" : "breakReminders";
  if (!preferences.notifications[preferenceKey]) {
    logger.debug(`[sendNotificationService] ${preferenceKey} disabled by user preference`);
    return;
  }

  // Only send notification once when 1 minute (60 seconds) remains
  if (secondsRemaining <= 60 && secondsRemaining > 50 && !timeEntry.notificationSentAt) {
    const { title, body } = getOneMinuteWarningNotificationOptions(timeEntry);
    const sessionEndTime = timeEntry.startTime + timeEntry.targetDuration * 60 * 1000;

    // Create extend session actions - these are placeholders, actual IPC will be handled in the UI
    const extendActions = [
      {
        label: "+ 5 minutes",
        action: async () => {}, // Placeholder - actual implementation in UI
        variant: "success" as const,
      },
      {
        label: "+ 25 minutes",
        action: async () => {}, // Placeholder - actual implementation in UI
        variant: "primary" as const,
      },
    ];

    try {
      await sendNotification(
        {
          title,
          body,
          userId: timeEntry.userId,
          type: "session_ending_warning",
          timeEntryId: timeEntry.id,
          createdAt: Date.now(),
          sessionEndTime, // Include session end time for countdown
          actions: extendActions, // Include extend session actions
        },
        undefined,
        false // Don't auto-dismiss when user has actions to take
      );

      // Mark that notification has been sent for this session
      await updateTimeEntry(timeEntry.id, { notificationSentAt: 1 });
    } catch (error) {
      logger.error("[sendNotification] Failed to send 1-minute warning notification", { error });
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

const getOneMinuteWarningNotificationOptions = (
  timeEntry: TimeEntryWithRelations
): { title: string; body: string } => {
  const taskTitle = getTitleTimeEntry(timeEntry);
  return {
    title: timeEntry.isFocusMode ? `Focus session ending soon! ⏰` : `Break ending soon! ⏰`,
    body: timeEntry.isFocusMode
      ? `Your focus session "${taskTitle}" will end in 1 minute. Prepare to wrap up! 🎯`
      : `Your break will end in 1 minute. Get ready to focus! 🚀`,
  };
};

function getSecondsToSendNoti(notificationSentAt: number | null): number {
  if (!notificationSentAt || notificationSentAt === 0) return 0;
  if (notificationSentAt === 1) return 2 * 60; // First reminder after 2 minutes
  if (notificationSentAt === 2) return 10 * 60; // Second reminder after 10 minutes
  if (notificationSentAt === 3) return 30 * 60; // Final reminder after 30 minutes

  return Number.MAX_SAFE_INTEGER;
}

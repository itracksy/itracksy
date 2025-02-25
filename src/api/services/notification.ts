import { NotificationOptions } from "@/types/notification";
import { logger } from "../../helpers/logger";
import { Notification, BrowserWindow } from "electron";
import { TimeEntryWithRelations } from "@/types/projects";
import { updateTimeEntry } from "./timeEntry";

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

  if (timeEntry.isFocusMode) {
    return {
      title: "Time for a Break! ",
      body:
        minutesExceeded > 0
          ? `You've been focused on "${sessionTitle}" for ${minutesExceeded} minutes over your target. Take a short break to recharge.`
          : `You've reached your focus time target for "${sessionTitle}". Time for a short break!`,
      requireInteraction: true,
    };
  }

  return {
    title: "Break Time's Over! ",
    body:
      minutesExceeded > 0
        ? `Your break has extended ${minutesExceeded} minutes over the target. Time to get back to work!`
        : "Time to get back to work! Open iTracksy to start tracking again.",
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

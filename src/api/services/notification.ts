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

export const sendNotification = (
  timeEntry: TimeEntryWithRelations,
  secondsExceeded: number
): void => {
  if (!timeEntry.targetDuration) {
    return;
  }

  console.log("timeExceeded", secondsExceeded);
  console.log("getTimeToSendNoti", getSecondsToSendNoti(timeEntry.notificationSentAt));

  if (
    (timeEntry.notificationSentAt ?? 0) < 3 &&
    secondsExceeded >= getSecondsToSendNoti(timeEntry.notificationSentAt)
  ) {
    const options = getNotificationOptions({
      timeEntry,
      minutesExceeded: Math.floor(secondsExceeded / 60),
    });
    sendSystemNotification(options);
    const notificationSentAt = (timeEntry.notificationSentAt ?? 0) + 1;
    console.log("notificationSentAt", notificationSentAt);
    updateTimeEntry(timeEntry.id, { notificationSentAt });
  }
};

const getNotificationOptions = ({
  timeEntry,
  minutesExceeded,
}: {
  timeEntry: TimeEntryWithRelations;
  minutesExceeded: number;
}): NotificationOptions => {
  if (timeEntry.isFocusMode) {
    return {
      title: "Time for a Break! ",
      body:
        minutesExceeded > 0
          ? `You've been focused for ${minutesExceeded} minutes over your target. Take a short break to recharge.`
          : "You've reached your focus time target. Time for a short break!",
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
  if (notificationSentAt === 1) return 5 * 60; // 5 minutes
  if (notificationSentAt === 2) return 25 * 60; // 25 minutes
  if (notificationSentAt === 3) return 60 * 60; // 1 hour

  return Number.MAX_SAFE_INTEGER;
}

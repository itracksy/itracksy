import {
  CLOCK_SHOW_CHANNEL,
  CLOCK_HIDE_CHANNEL,
  CLOCK_UPDATE_CHANNEL,
  CLOCK_CONTROL_CHANNEL,
  CLOCK_SETTINGS_CHANNEL,
} from "./clock-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";
import { showClockWindow, hideClockWindow, getClockWindow } from "../../../main/windows/clock";
import { logger } from "../../logger";
import { getCurrentUserIdLocalStorage } from "../../../api/services/userSettings";
import {
  createTimeEntry,
  getActiveTimeEntry,
  updateTimeEntry,
} from "../../../api/services/timeEntry";

export const addClockEventListeners = () => {
  logger.debug("ClockListeners: Adding clock listeners");

  // Show clock handler
  safelyRegisterListener(CLOCK_SHOW_CHANNEL, async (_event) => {
    try {
      logger.debug("Clock show requested");
      showClockWindow();
      return { success: true };
    } catch (error) {
      logger.error("Failed to show clock", { error });
      throw error;
    }
  });

  // Hide clock handler
  safelyRegisterListener(CLOCK_HIDE_CHANNEL, async (_event) => {
    try {
      logger.debug("Clock hide requested");
      hideClockWindow();
      return { success: true };
    } catch (error) {
      logger.error("Failed to hide clock", { error });
      throw error;
    }
  });

  // Clock control handler (start, pause, stop timer)
  safelyRegisterListener(CLOCK_CONTROL_CHANNEL, async (_event, { action, data }) => {
    try {
      logger.debug("Clock control action", { action, data });

      const userId = await getCurrentUserIdLocalStorage();
      if (!userId) {
        throw new Error("No user ID available");
      }

      let result;

      switch (action) {
        case "start":
          // Start a new time entry
          result = await createTimeEntry(
            {
              isFocusMode: data?.isFocusMode ?? true,
              startTime: Date.now(),
              targetDuration: data?.targetDuration ?? 25, // Default 25 minutes
              description: data?.description ?? "Focus Session",
            },
            userId
          );
          break;

        case "pause":
          // Pause current time entry
          const activeEntry = await getActiveTimeEntry(userId);
          if (activeEntry) {
            result = await updateTimeEntry(activeEntry.id, {
              endTime: Date.now(),
            });
          }
          break;

        case "stop":
          // Stop current time entry
          const currentEntry = await getActiveTimeEntry(userId);
          if (currentEntry) {
            result = await updateTimeEntry(currentEntry.id, {
              endTime: Date.now(),
            });
          }
          break;

        case "resume":
          // Resume with a new entry (since we don't have pause/resume in current schema)
          result = await createTimeEntry(
            {
              isFocusMode: data?.isFocusMode ?? true,
              startTime: Date.now(),
              targetDuration: data?.targetDuration ?? 25,
              description: data?.description ?? "Resumed Session",
            },
            userId
          );
          break;

        default:
          throw new Error(`Unknown clock action: ${action}`);
      }

      // Send update to clock window
      const clockWindow = getClockWindow();
      if (clockWindow) {
        const updatedEntry = await getActiveTimeEntry(userId);
        clockWindow.webContents.send(CLOCK_UPDATE_CHANNEL, {
          activeEntry: updatedEntry,
          action,
          timestamp: Date.now(),
        });
      }

      return { success: true, result };
    } catch (error) {
      logger.error("Failed to handle clock control", { error, action, data });
      throw error;
    }
  });

  // Settings handler
  safelyRegisterListener(CLOCK_SETTINGS_CHANNEL, async (_event) => {
    try {
      logger.debug("Clock settings requested");
      // TODO: Open main window settings or create a mini settings dialog
      return { success: true };
    } catch (error) {
      logger.error("Failed to open settings from clock", { error });
      throw error;
    }
  });
};

// Function to send updates to clock window
export const sendClockUpdate = (data: any) => {
  const clockWindow = getClockWindow();
  if (clockWindow && !clockWindow.isDestroyed()) {
    clockWindow.webContents.send(CLOCK_UPDATE_CHANNEL, data);
  }
};

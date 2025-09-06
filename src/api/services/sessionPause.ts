import { getCurrentUserIdLocalStorage } from "./userSettings";
import { getActiveTimeEntry, updateTimeEntry } from "./timeEntry";
import { logger } from "../../helpers/logger";

interface PausedSession {
  timeEntryId: string;
  pausedAt: number;
  originalStartTime: number;
}

let pausedSession: PausedSession | null = null;

/**
 * Pause the current active time entry when system becomes inactive
 */
export const pauseActiveSession = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return;
    }

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry || activeEntry.endTime) {
      return; // No active session to pause
    }

    // Store pause information
    pausedSession = {
      timeEntryId: activeEntry.id,
      pausedAt: Date.now(),
      originalStartTime: activeEntry.startTime,
    };

    logger.info(
      `[SessionPause] Paused session ${activeEntry.id} at ${new Date(Date.now()).toISOString()}`
    );
  } catch (error) {
    logger.error("[SessionPause] Error pausing session", { error });
  }
};

/**
 * Resume the paused time entry when system becomes active
 * Adjusts the start time to account for the paused duration
 */
export const resumeActiveSession = async (): Promise<void> => {
  try {
    if (!pausedSession) {
      return; // No session was paused
    }

    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return;
    }

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry || activeEntry.id !== pausedSession.timeEntryId) {
      // Session has changed or ended, clear paused state
      pausedSession = null;
      return;
    }

    const pausedDuration = Date.now() - pausedSession.pausedAt;
    const newStartTime = pausedSession.originalStartTime + pausedDuration;

    // Update the time entry to adjust for paused time
    await updateTimeEntry(activeEntry.id, {
      startTime: newStartTime,
    });

    logger.info(
      `[SessionPause] Resumed session ${activeEntry.id}, adjusted start time by ${Math.floor(pausedDuration / 1000)} seconds`
    );

    // Clear paused state
    pausedSession = null;
  } catch (error) {
    logger.error("[SessionPause] Error resuming session", { error });
    // Clear paused state even on error to prevent stuck states
    pausedSession = null;
  }
};

/**
 * Get the current paused session information
 */
export const getPausedSession = (): PausedSession | null => {
  return pausedSession;
};

/**
 * Clear any paused session state (useful for cleanup)
 */
export const clearPausedSession = (): void => {
  pausedSession = null;
};

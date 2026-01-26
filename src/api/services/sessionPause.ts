import { getCurrentUserIdLocalStorage } from "./userSettings";
import { getActiveTimeEntry, updateTimeEntry } from "./timeEntry";
import { logger } from "../../helpers/logger";
import { sendPauseStateUpdate } from "../../helpers/ipc/session-pause/session-pause-sender";

interface PausedSession {
  timeEntryId: string;
  pausedAt: number;
  originalStartTime: number;
  isManualPause: boolean;
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
      isManualPause: false,
    };

    // Notify renderer immediately
    sendPauseStateUpdate({
      isPaused: true,
      pausedAt: pausedSession.pausedAt,
      timeEntryId: pausedSession.timeEntryId,
    });

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

    // Notify renderer immediately
    sendPauseStateUpdate({
      isPaused: false,
      pausedAt: null,
      timeEntryId: null,
    });
  } catch (error) {
    logger.error("[SessionPause] Error resuming session", { error });
    // Clear paused state even on error to prevent stuck states
    pausedSession = null;

    // Notify renderer even on error
    sendPauseStateUpdate({
      isPaused: false,
      pausedAt: null,
      timeEntryId: null,
    });
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

/**
 * Check if the current session is manually paused
 */
export const isSessionManuallyPaused = (): boolean => {
  return pausedSession?.isManualPause ?? false;
};

/**
 * Manually pause the current active session
 */
export const manualPauseSession = async (): Promise<{
  success: boolean;
  pausedAt: number | null;
  error?: string;
}> => {
  try {
    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return { success: false, pausedAt: null, error: "No user found" };
    }

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry || activeEntry.endTime) {
      return { success: false, pausedAt: null, error: "No active session to pause" };
    }

    // If already paused, just return success with existing pausedAt
    if (pausedSession && pausedSession.timeEntryId === activeEntry.id) {
      return { success: true, pausedAt: pausedSession.pausedAt };
    }

    const now = Date.now();
    pausedSession = {
      timeEntryId: activeEntry.id,
      pausedAt: now,
      originalStartTime: activeEntry.startTime,
      isManualPause: true,
    };

    // Notify renderer immediately
    sendPauseStateUpdate({
      isPaused: true,
      pausedAt: now,
      timeEntryId: activeEntry.id,
    });

    logger.info(
      `[SessionPause] Manually paused session ${activeEntry.id} at ${new Date(now).toISOString()}`
    );

    return { success: true, pausedAt: now };
  } catch (error) {
    logger.error("[SessionPause] Error manually pausing session", { error });
    return {
      success: false,
      pausedAt: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Manually resume the current paused session
 */
export const manualResumeSession = async (): Promise<{
  success: boolean;
  adjustedBy: number;
  error?: string;
}> => {
  try {
    if (!pausedSession) {
      return { success: false, adjustedBy: 0, error: "No paused session found" };
    }

    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return { success: false, adjustedBy: 0, error: "No user found" };
    }

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry || activeEntry.id !== pausedSession.timeEntryId) {
      pausedSession = null;
      return { success: false, adjustedBy: 0, error: "Session has changed or ended" };
    }

    const pausedDuration = Date.now() - pausedSession.pausedAt;
    const newStartTime = pausedSession.originalStartTime + pausedDuration;

    await updateTimeEntry(activeEntry.id, {
      startTime: newStartTime,
    });

    logger.info(
      `[SessionPause] Manually resumed session ${activeEntry.id}, adjusted start time by ${Math.floor(pausedDuration / 1000)} seconds`
    );

    pausedSession = null;

    // Notify renderer immediately
    sendPauseStateUpdate({
      isPaused: false,
      pausedAt: null,
      timeEntryId: null,
    });

    return { success: true, adjustedBy: pausedDuration };
  } catch (error) {
    logger.error("[SessionPause] Error manually resuming session", { error });
    pausedSession = null;

    // Notify renderer even on error
    sendPauseStateUpdate({
      isPaused: false,
      pausedAt: null,
      timeEntryId: null,
    });

    return {
      success: false,
      adjustedBy: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

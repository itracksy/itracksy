import { BrowserWindow } from "electron";
import { SESSION_PAUSE_STATE_CHANNEL } from "./session-pause-channels";
import { logger } from "../../logger";
import type { TimeEntry } from "@/types/ipc";

export interface SessionPauseState {
  isPaused: boolean;
  pausedAt: number | null;
  timeEntryId: string | null;
  requiresResume?: boolean;
  activeEntry?: TimeEntry | null;
}

/**
 * Send pause state update to all renderer windows
 */
export function sendPauseStateUpdate(state: SessionPauseState): void {
  try {
    const windows = BrowserWindow.getAllWindows();
    logger.info("[SessionPause] Sending pause state update to renderers", {
      isPaused: state.isPaused,
      pausedAt: state.pausedAt ? new Date(state.pausedAt).toISOString() : null,
      timeEntryId: state.timeEntryId,
      requiresResume: state.requiresResume,
      hasActiveEntry: !!state.activeEntry,
      windowCount: windows.length,
    });
    for (const window of windows) {
      if (!window.isDestroyed()) {
        window.webContents.send(SESSION_PAUSE_STATE_CHANNEL, state);
      }
    }
  } catch (error) {
    logger.error("[SessionPause] Failed to send pause state update", { error });
  }
}

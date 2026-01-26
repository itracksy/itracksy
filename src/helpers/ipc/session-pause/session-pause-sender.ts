import { BrowserWindow } from "electron";
import { SESSION_PAUSE_STATE_CHANNEL } from "./session-pause-channels";
import { logger } from "../../logger";

export interface SessionPauseState {
  isPaused: boolean;
  pausedAt: number | null;
  timeEntryId: string | null;
  requiresResume?: boolean;
  activeEntry?: any;
}

/**
 * Send pause state update to all renderer windows
 */
export function sendPauseStateUpdate(state: SessionPauseState): void {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const window of windows) {
      if (!window.isDestroyed()) {
        window.webContents.send(SESSION_PAUSE_STATE_CHANNEL, state);
      }
    }
    logger.debug("[SessionPause] Sent pause state update to renderers", state);
  } catch (error) {
    logger.error("[SessionPause] Failed to send pause state update", { error });
  }
}

import { contextBridge, ipcRenderer } from "electron";
import { SESSION_PAUSE_STATE_CHANNEL } from "./session-pause-channels";

export interface SessionPauseState {
  isPaused: boolean;
  pausedAt: number | null;
  timeEntryId: string | null;
  requiresResume?: boolean;
  activeEntry?: any;
}

export function exposeSessionPauseContext() {
  contextBridge.exposeInMainWorld("electronSessionPause", {
    // Function to listen for pause state changes
    onPauseStateChange: (callback: (state: SessionPauseState) => void) => {
      ipcRenderer.on(SESSION_PAUSE_STATE_CHANNEL, (_event, state) => {
        callback(state);
      });
    },

    // Function to remove pause state listener
    removePauseStateListener: () => {
      ipcRenderer.removeAllListeners(SESSION_PAUSE_STATE_CHANNEL);
    },
  });
}

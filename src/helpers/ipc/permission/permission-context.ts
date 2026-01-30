import { contextBridge, ipcRenderer } from "electron";
import { PERMISSION_ERROR_CHANNEL } from "./permission-channels";
import { logger } from "../../logger";

export interface PermissionErrorData {
  type: "screen-recording" | "accessibility";
  message: string;
  timestamp: number;
}

export function exposePermissionContext() {
  contextBridge.exposeInMainWorld("electronPermission", {
    // Listen for permission error events from main process
    onPermissionError: (callback: (data: PermissionErrorData) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: PermissionErrorData) => {
        logger.debug("[Permission] Received permission-error event", data);
        callback(data);
      };
      ipcRenderer.on(PERMISSION_ERROR_CHANNEL, handler);

      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(PERMISSION_ERROR_CHANNEL, handler);
      };
    },
  });
}

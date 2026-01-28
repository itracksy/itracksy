import { ipcMain, IpcMainInvokeEvent } from "electron";
import { logger } from "../logger";

const registeredListeners = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IpcHandler = (event: IpcMainInvokeEvent, ...args: any[]) => unknown | Promise<unknown>;

export function safelyRegisterListener(channel: string, handler: IpcHandler) {
  if (registeredListeners.has(channel)) {
    ipcMain.removeHandler(channel);
  }
  logger.debug(`Registering listener for channel ${channel}`);
  ipcMain.handle(channel, handler);
  registeredListeners.add(channel);
}

function cleanupListeners() {
  registeredListeners.forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
  registeredListeners.clear();
}

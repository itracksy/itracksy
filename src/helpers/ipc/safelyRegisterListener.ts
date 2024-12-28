import { ipcMain } from "electron";

const registeredListeners = new Set<string>();

export function safelyRegisterListener(channel: string, handler: (...args: any[]) => any) {
  if (registeredListeners.has(channel)) {
    ipcMain.removeHandler(channel);
  }
  ipcMain.handle(channel, handler);
  registeredListeners.add(channel);
}

export function cleanupListeners() {
  registeredListeners.forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
  registeredListeners.clear();
}

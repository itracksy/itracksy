import { BrowserWindow, ipcMain } from "electron";
import type Store from "electron-store";

import {
  STORE_CHANNELS,
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
} from "./window-channels";

let store: Store;

const initStore = async () => {
  const electronStore = await import("electron-store");
  store = new electronStore.default();
  console.log("Store initialized", store);
};

export const addWindowEventListeners = async (mainWindow: BrowserWindow) => {
  await initStore();

  ipcMain.handle(WIN_MINIMIZE_CHANNEL, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(WIN_MAXIMIZE_CHANNEL, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(WIN_CLOSE_CHANNEL, () => {
    mainWindow.close();
  });
  ipcMain.handle(STORE_CHANNELS.GET, async (_event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle(STORE_CHANNELS.SET, async (_event, key: string, value: any) => {
    store.set(key, value);
  });
};

import { BrowserWindow, ipcMain } from "electron";
import type Store from "electron-store";

import {
  STORE_CHANNELS,
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
} from "./window-channels";

let store: Store;

 

export const addWindowEventListeners =   (mainWindow: BrowserWindow) => {
  console.log("[Window Listeners] Initializing window event listeners...", ipcMain);
 

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
      return false;
    });

    ipcMain.handle(STORE_CHANNELS.SET, async (_event, key: string, value: any) => {
      return false;
    });
 

  console.log("[Window Listeners] Registered events:", ipcMain);
};

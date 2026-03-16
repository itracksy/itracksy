import type { BrowserWindow, Tray } from "electron";

let mainWindowRef: BrowserWindow | null = null;
let trayRef: Tray | null = null;

export const setMainWindowReference = (mainWindow: BrowserWindow | null): void => {
  mainWindowRef = mainWindow;
};

export const setTrayReference = (tray: Tray | null): void => {
  trayRef = tray;
};

export const setWindowReferences = (mainWindow: BrowserWindow | null, tray: Tray | null): void => {
  mainWindowRef = mainWindow;
  trayRef = tray;
};

export const getMainWindowReference = (): BrowserWindow | null => {
  return mainWindowRef;
};

export const getTrayReference = (): Tray | null => {
  return trayRef;
};

import { BrowserWindow, ipcMain } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  // Register new listeners
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
}

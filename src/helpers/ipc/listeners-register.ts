import { BrowserWindow, Tray } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";

export default function registerListeners(mainWindow: BrowserWindow, tray: Tray | null) {
  // Register new listeners
  addWindowEventListeners(mainWindow, tray);
  addThemeEventListeners();
}

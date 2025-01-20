import { BrowserWindow, Tray } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";

export default function registerListeners(mainWindow: BrowserWindow, tray: Tray | null) {
  console.log("Register: Registering listeners with tray", tray ? "defined" : "undefined");
  // Register new listeners
  addWindowEventListeners(mainWindow, tray);
  addThemeEventListeners();
}

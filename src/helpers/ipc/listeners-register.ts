import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";

export default async function registerListeners(mainWindow: BrowserWindow) {
  await addWindowEventListeners(mainWindow);
  addThemeEventListeners();
}

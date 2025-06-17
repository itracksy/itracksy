import { BrowserWindow, Tray } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addNotificationEventListeners } from "./notification/notification-listeners";
import { addBlockingNotificationEventListeners } from "./blocking-notification/blocking-notification-listeners";
import { addClockEventListeners } from "./clock/clock-listeners";

export default function registerListeners(mainWindow: BrowserWindow, tray: Tray | null) {
  // Register new listeners
  addWindowEventListeners(mainWindow, tray);
  addThemeEventListeners();
  addNotificationEventListeners();
  addBlockingNotificationEventListeners();
  addClockEventListeners();
}

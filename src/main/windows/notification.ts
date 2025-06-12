import { BrowserWindow } from "electron";
import path from "path";

// Declare the Vite environment variables for notification window
declare const NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL: string;
declare const NOTIFICATION_WINDOW_VITE_NAME: string;

let notificationWindow: BrowserWindow | null = null;

export function createNotificationWindow(): BrowserWindow {
  console.log("Creating notification window");
  // Don't create multiple notification windows
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    console.log("Reusing existing notification window");
    notificationWindow.focus();
    return notificationWindow;
  }
  const preload = path.join(__dirname, "./preload/notification.js");
  console.log("Notification: Preload path:", preload);
  console.log("Creating new notification window");

  // Get the primary display to position the notification
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  notificationWindow = new BrowserWindow({
    width: 380,
    height: 150,
    x: screenWidth - 400, // Position 20px from right edge
    y: 20, // Position 20px from top
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    webPreferences: {
      preload: preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the notification app
  if (NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL) {
    console.log(`Loading notification URL: ${NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL}`);
    notificationWindow.loadURL(NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading notification from file");
    notificationWindow.loadFile(path.join(__dirname, `../renderer/notification/index.html`));
  }

  notificationWindow.on("closed", () => {
    console.log("Notification window closed");
    notificationWindow = null;
  });

  // Open DevTools for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Opening notification window DevTools");
    notificationWindow.webContents.openDevTools();
  }

  return notificationWindow;
}

export function getNotificationWindow(): BrowserWindow | null {
  console.log("Getting notification window reference");
  return notificationWindow;
}

export function closeNotificationWindow(): void {
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    console.log("Closing notification window");
    notificationWindow.close();
    notificationWindow = null;
  }
}

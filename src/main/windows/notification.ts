/// <reference path="../../../forge.env.d.ts" />
import { BrowserWindow, screen } from "electron";
import path from "path";

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
    width: 500,
    height: 300,
    minWidth: 400,
    minHeight: 200,
    maxWidth: 800,
    maxHeight: 600,
    x: screenWidth - 520, // Position 20px from right edge
    y: 20, // Position 20px from top
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    transparent: true,
    webPreferences: {
      preload: preload,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      scrollBounce: false, // Disable scroll bouncing on macOS
    },
  });

  // Load the notification app
  if (NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL) {
    console.log(`Loading notification URL: ${NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL}`);
    notificationWindow.loadURL(NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading notification from file");
    notificationWindow.loadFile(
      path.join(__dirname, `../renderer/${NOTIFICATION_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Inject CSS to hide scrollbars and ensure proper content sizing
  notificationWindow.webContents.on("did-finish-load", () => {
    console.log("Notification window loaded, injecting CSS for scrollbar prevention");
    notificationWindow?.webContents.insertCSS(`
      ::-webkit-scrollbar {
        display: none !important;
      }

      body {
        overflow: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html {
        overflow: hidden !important;
        scrollbar-width: none !important;
      }

      * {
        overflow-x: hidden !important;
        overflow-y: hidden !important;
      }
    `);
  });

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

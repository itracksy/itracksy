/// <reference path="../../../forge.env.d.ts" />
import { BrowserWindow, screen } from "electron";
import path from "path";
import { logger } from "@/helpers/logger";

let notificationWindow: BrowserWindow | null = null;

export function createNotificationWindow(): BrowserWindow {
  logger.info("[NotificationWindow] createNotificationWindow called");
  // Don't create multiple notification windows
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    const isVisible = notificationWindow.isVisible();
    const bounds = notificationWindow.getBounds();
    logger.info("[NotificationWindow] Reusing existing window", {
      id: notificationWindow.id,
      isVisible,
      bounds,
    });
    // We do NOT automatically show/focus here anymore.
    // Consumers must call showNotificationWindow() explicitly.
    return notificationWindow;
  }
  const preload = path.join(__dirname, "./preload/notification.js");
  logger.info("[NotificationWindow] Preload path:", preload);
  logger.info("[NotificationWindow] Creating NEW notification window");

  // Get the primary display to position the notification
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
    show: false, // Start hidden to prevent ghost window
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
    logger.info(
      `[NotificationWindow] Loading from URL: ${NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL}`
    );
    notificationWindow.loadURL(NOTIFICATION_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    logger.info("[NotificationWindow] Loading from file");
    notificationWindow.loadFile(
      path.join(__dirname, `../renderer/${NOTIFICATION_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Inject CSS to hide scrollbars and ensure proper content sizing
  notificationWindow.webContents.on("did-finish-load", () => {
    logger.info("[NotificationWindow] Window loaded, injecting CSS for scrollbar prevention");
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
        -ms-overflow-style: none !important;
      }

      * {
        overflow-x: hidden !important;
        overflow-y: hidden !important;
      }
    `);
  });

  notificationWindow.on("closed", () => {
    logger.info("[NotificationWindow] Window closed event");
    notificationWindow = null;
  });

  notificationWindow.on("show", () => {
    logger.info("[NotificationWindow] Window show event", {
      bounds: notificationWindow?.getBounds(),
      isVisible: notificationWindow?.isVisible(),
    });
  });

  notificationWindow.on("hide", () => {
    logger.info("[NotificationWindow] Window hide event");
  });

  // Open DevTools for debugging
  if (process.env.NODE_ENV === "development") {
    logger.info("[NotificationWindow] Opening DevTools");
    notificationWindow.webContents.openDevTools({ mode: "detach" });
  }

  const bounds = notificationWindow.getBounds();
  logger.info("[NotificationWindow] New window created", {
    id: notificationWindow.id,
    bounds,
    show: false,
  });

  return notificationWindow;
}

export function getNotificationWindow(): BrowserWindow | null {
  logger.info("[NotificationWindow] Getting notification window reference");
  return notificationWindow;
}

export function showNotificationWindow(): void {
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    const wasVisible = notificationWindow.isVisible();
    const bounds = notificationWindow.getBounds();
    logger.info("[NotificationWindow] showNotificationWindow called", {
      wasVisible,
      bounds,
      id: notificationWindow.id,
    });

    // Ensure we capture mouse events when showing
    try {
      notificationWindow.setIgnoreMouseEvents(false);
      logger.info("[NotificationWindow] setIgnoreMouseEvents(false) - mouse events ENABLED");
    } catch (error) {
      logger.error("[NotificationWindow] Failed to enable mouse events:", error);
    }

    notificationWindow.show();
    notificationWindow.focus();

    logger.info("[NotificationWindow] show() and focus() called, window should be visible now");
  } else {
    logger.warn(
      "[NotificationWindow] showNotificationWindow called but window doesn't exist or is destroyed"
    );
  }
}

export function hideNotificationWindow(): void {
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    const wasVisible = notificationWindow.isVisible();
    logger.info("[NotificationWindow] hideNotificationWindow called", {
      wasVisible,
      id: notificationWindow.id,
    });

    // Ignore mouse events to prevent ghost window
    try {
      notificationWindow.setIgnoreMouseEvents(true);
      logger.info("[NotificationWindow] setIgnoreMouseEvents(true) - mouse events DISABLED");
    } catch (error) {
      logger.error("[NotificationWindow] Failed to ignore mouse events:", error);
    }

    notificationWindow.hide();
    logger.info("[NotificationWindow] hide() called, window should be hidden now");
  }
}

export function closeNotificationWindow(): void {
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    const wasVisible = notificationWindow.isVisible();
    const bounds = notificationWindow.getBounds();
    logger.info("[NotificationWindow] closeNotificationWindow called", {
      wasVisible,
      bounds,
      id: notificationWindow.id,
    });

    // Ignore mouse events before closing to prevent ghost window
    try {
      notificationWindow.setIgnoreMouseEvents(true);
      logger.info(
        "[NotificationWindow] setIgnoreMouseEvents(true) - mouse events DISABLED before close"
      );
    } catch (error) {
      logger.error("[NotificationWindow] Failed to ignore mouse events before close:", error);
    }

    notificationWindow.close();
    notificationWindow = null;
    logger.info("[NotificationWindow] close() called and window reference set to null");
  } else {
    logger.warn(
      "[NotificationWindow] closeNotificationWindow called but window doesn't exist or is destroyed"
    );
  }
}

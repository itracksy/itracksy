/// <reference path="../../../forge.env.d.ts" />
import { logger } from "@/helpers/logger";
import { BrowserWindow, screen } from "electron";
import path from "path";

let clockWindow: BrowserWindow | null = null;
let isClockVisible = false;

export function createClockWindow(): BrowserWindow {
  logger.info("Creating clock window");

  // Don't create multiple clock windows
  if (clockWindow && !clockWindow.isDestroyed()) {
    logger.info("Reusing existing clock window");
    return clockWindow;
  }

  const preload = path.join(__dirname, "./preload/clock.js");
  logger.info("Clock: Preload path:", preload);

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Clock window dimensions - consistent for both idle and active states
  const windowWidth = 96;
  const windowHeight = 34;

  // Position in top-right corner with some margin
  const x = screenWidth - windowWidth - 20;
  const y = 20;

  clockWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: "rgba(0, 0, 0, 0)", // Fully transparent background
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    show: false,
    hasShadow: false, // Disable shadow for cleaner transparent look
    webPreferences: {
      preload: preload,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Prevent throttling for smooth animations
    },
    vibrancy: "under-window", // macOS vibrancy effect
    visualEffectState: "active",
  });

  // Load the clock app
  if (CLOCK_WINDOW_VITE_DEV_SERVER_URL) {
    logger.info(`Loading clock URL: ${CLOCK_WINDOW_VITE_DEV_SERVER_URL}`);
    clockWindow.loadURL(CLOCK_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    logger.info("CLOCK_WINDOW_VITE_NAME:", CLOCK_WINDOW_VITE_NAME);
    const rendererDir =
      CLOCK_WINDOW_VITE_NAME === "clock" ? "clock_window" : CLOCK_WINDOW_VITE_NAME;
    clockWindow.loadFile(path.join(__dirname, `../renderer/${rendererDir}/index.html`));
  }

  // Handle window events
  clockWindow.on("closed", () => {
    logger.info("Clock window closed");
    clockWindow = null;
    isClockVisible = false;
  });

  clockWindow.on("show", () => {
    isClockVisible = true;
  });

  clockWindow.on("hide", () => {
    isClockVisible = false;
  });

  // Open DevTools for debugging in development
  if (process.env.NODE_ENV === "development") {
    logger.info("Opening clock window DevTools");
    clockWindow.webContents.openDevTools({ mode: "detach" });
  }

  return clockWindow;
}

export function getClockWindow(): BrowserWindow | null {
  logger.info("Getting clock window reference");
  return clockWindow;
}

export function showClockWindow(): void {
  if (!clockWindow || clockWindow.isDestroyed()) {
    createClockWindow();
  }

  if (clockWindow) {
    logger.info("Showing clock window");
    clockWindow.show();
    clockWindow.focus();
    isClockVisible = true;
  }
}

export function hideClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed() && isClockVisible) {
    logger.info("Hiding clock window");
    clockWindow.hide();
    isClockVisible = false;
  }
}

export function closeClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed()) {
    logger.info("Closing clock window");
    clockWindow.close();
    clockWindow = null;
    isClockVisible = false;
  }
}

export function isClockWindowVisible(): boolean {
  return isClockVisible && clockWindow !== null && !clockWindow.isDestroyed();
}

export function toggleClockWindow(): void {
  if (isClockWindowVisible()) {
    hideClockWindow();
  } else {
    showClockWindow();
  }
}

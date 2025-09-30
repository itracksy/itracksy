/// <reference path="../../../forge.env.d.ts" />
import { logger } from "@/helpers/logger";
import { BrowserWindow, screen, ipcMain } from "electron";
import {
  CLOCK_TOGGLE_PIN_CHANNEL,
  CLOCK_GET_STATE_CHANNEL,
} from "@/helpers/ipc/clock/clock-channels";
import path from "path";

let clockWindow: BrowserWindow | null = null;
let isClockVisible = false;
let isPinned = true;

export function createClockWindow(): BrowserWindow {
  console.log("Creating clock window");

  // Don't create multiple clock windows
  if (clockWindow && !clockWindow.isDestroyed()) {
    console.log("Reusing existing clock window");
    return clockWindow;
  }

  const preload = path.join(__dirname, "./preload/clock.js");
  console.log("Clock: Preload path:", preload);

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Clock window dimensions - consistent for both idle and active states
  const windowWidth = 280;
  const windowHeight = 160;

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
    alwaysOnTop: isPinned,
    skipTaskbar: true,
    resizable: true,
    minWidth: 220,
    minHeight: 140,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    show: false,
    hasShadow: true,
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
    console.log(`Loading clock URL: ${CLOCK_WINDOW_VITE_DEV_SERVER_URL}`);
    clockWindow.loadURL(CLOCK_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    logger.info("CLOCK_WINDOW_VITE_NAME:", CLOCK_WINDOW_VITE_NAME);
    const rendererDir =
      CLOCK_WINDOW_VITE_NAME === "clock" ? "clock_window" : CLOCK_WINDOW_VITE_NAME;
    clockWindow.loadFile(path.join(__dirname, `../renderer/${rendererDir}/index.html`));
  }

  // Handle window events
  clockWindow.on("closed", () => {
    console.log("Clock window closed");
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
    console.log("Opening clock window DevTools");
    clockWindow.webContents.openDevTools({ mode: "detach" });
  }

  return clockWindow;
}

export function getClockWindow(): BrowserWindow | null {
  console.log("Getting clock window reference");
  return clockWindow;
}

export function showClockWindow(): void {
  if (!clockWindow || clockWindow.isDestroyed()) {
    createClockWindow();
  }

  if (clockWindow) {
    console.log("Showing clock window");
    clockWindow.show();
    clockWindow.focus();
    isClockVisible = true;
  }
}

export function hideClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed() && isClockVisible) {
    console.log("Hiding clock window");
    clockWindow.hide();
    isClockVisible = false;
  }
}

export function closeClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed()) {
    console.log("Closing clock window");
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

function registerClockIpcHandlers(): void {
  ipcMain.handle(CLOCK_TOGGLE_PIN_CHANNEL, () => {
    isPinned = !isPinned;
    if (clockWindow && !clockWindow.isDestroyed()) {
      clockWindow.setAlwaysOnTop(isPinned, "screen-saver");
      if (isPinned) {
        clockWindow.moveTop();
      }
    }
    return { isPinned };
  });

  ipcMain.handle(CLOCK_GET_STATE_CHANNEL, () => {
    return {
      isPinned,
      isVisible: isClockWindowVisible(),
      bounds: clockWindow?.getBounds() ?? null,
    };
  });
}

registerClockIpcHandlers();

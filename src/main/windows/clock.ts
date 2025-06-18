import { BrowserWindow, screen } from "electron";
import path from "path";

// Declare the Vite environment variables for clock window
declare const CLOCK_WINDOW_VITE_DEV_SERVER_URL: string;
declare const CLOCK_WINDOW_VITE_NAME: string;

let clockWindow: BrowserWindow | null = null;
let isClockVisible = false;

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

  // Clock window dimensions
  const windowWidth = 280;
  const windowHeight = 120;

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
    backgroundColor: "rgba(0, 0, 0, 0)",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
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
    },
    vibrancy: "under-window", // macOS vibrancy effect
    visualEffectState: "active",
  });

  // Load the clock app
  if (CLOCK_WINDOW_VITE_DEV_SERVER_URL) {
    console.log(`Loading clock URL: ${CLOCK_WINDOW_VITE_DEV_SERVER_URL}`);
    clockWindow.loadURL(CLOCK_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading clock from file");
    clockWindow.loadFile(path.join(__dirname, `../renderer/clock/index.html`));
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

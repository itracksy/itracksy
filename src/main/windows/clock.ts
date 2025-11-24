/// <reference path="../../../forge.env.d.ts" />
import { logger } from "@/helpers/logger";
import { BrowserWindow, screen, ipcMain, app } from "electron";
import {
  CLOCK_TOGGLE_PIN_CHANNEL,
  CLOCK_GET_STATE_CHANNEL,
  CLOCK_SET_SIZE_MODE_CHANNEL,
} from "@/helpers/ipc/clock/clock-channels";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

type ClockSizeMode = "detailed" | "minimal";

const SIZE_PRESETS: Record<ClockSizeMode, { width: number; height: number; minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }> = {
  detailed: {
    width: 340,
    height: 230,
    minWidth: 340,
    minHeight: 230,
    maxWidth: 340,
    maxHeight: 230,
  },
  minimal: {
    width: 200,
    height: 109,
    minWidth: 200,
    minHeight: 109,
    maxWidth: 200,
    maxHeight: 109,
  },
};

interface ClockWindowBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface ClockWindowState {
  readonly bounds?: ClockWindowBounds;
  readonly sizeMode?: ClockSizeMode;
  readonly isPinned?: boolean;
}

const CLOCK_STATE_FILE_NAME = "clock-window-state.json";
let cachedClockWindowState: ClockWindowState | null = null;

const getClockWindowStateFilePath = (): string => {
  const directory: string = app.getPath("userData");
  return path.join(directory, CLOCK_STATE_FILE_NAME);
};

const loadClockWindowState = (): ClockWindowState => {
  try {
    const filePath: string = getClockWindowStateFilePath();
    if (!existsSync(filePath)) {
      return {};
    }
    const rawState: string = readFileSync(filePath, "utf-8");
    if (!rawState.trim()) {
      return {};
    }
    const parsedState: ClockWindowState = JSON.parse(rawState) as ClockWindowState;
    return parsedState;
  } catch (error) {
    logger.warn("Clock: Failed to load window state", { error });
    return {};
  }
};

const getClockWindowState = (): ClockWindowState => {
  if (!cachedClockWindowState) {
    cachedClockWindowState = loadClockWindowState();
  }
  return cachedClockWindowState;
};

const saveClockWindowState = (partialState: Partial<ClockWindowState>): void => {
  const currentState: ClockWindowState = getClockWindowState();
  const nextState: ClockWindowState = {
    ...currentState,
    ...partialState,
    bounds: partialState.bounds ?? currentState.bounds,
  };
  cachedClockWindowState = nextState;
  try {
    const filePath: string = getClockWindowStateFilePath();
    writeFileSync(filePath, JSON.stringify(nextState, null, 2), "utf-8");
  } catch (error) {
    logger.warn("Clock: Failed to save window state", { error });
  }
};

let clockWindow: BrowserWindow | null = null;
let isClockVisible = false;
let boundsSaveTimeout: NodeJS.Timeout | null = null;

const initialState: ClockWindowState = getClockWindowState();
let isPinned = initialState.isPinned ?? true;
let currentSizeMode: ClockSizeMode = initialState.sizeMode ?? "detailed";

const getWindowBoundsSnapshot = (win: BrowserWindow): ClockWindowBounds => {
  const { x, y, width, height } = win.getBounds();
  return { x, y, width, height };
};

const scheduleBoundsSave = (): void => {
  if (!clockWindow || clockWindow.isDestroyed()) {
    return;
  }
  if (boundsSaveTimeout) {
    clearTimeout(boundsSaveTimeout);
  }
  boundsSaveTimeout = setTimeout(() => {
    if (!clockWindow || clockWindow.isDestroyed()) {
      return;
    }
    saveClockWindowState({ bounds: getWindowBoundsSnapshot(clockWindow) });
  }, 200);
};

function getSizePreset(mode: ClockSizeMode) {
  return SIZE_PRESETS[mode];
}

function calculateAnchorX(originalX: number, originalWidth: number, targetWidth: number): number {
  const newX = originalX + originalWidth - targetWidth;
  return Math.max(0, newX);
}

function applySizeMode(mode: ClockSizeMode, reposition = true, persist = true): void {
  if (!clockWindow) {
    currentSizeMode = mode;
    return;
  }

  currentSizeMode = mode;
  const preset = getSizePreset(mode);
  clockWindow.setMinimumSize(preset.minWidth, preset.minHeight);
  clockWindow.setMaximumSize(preset.maxWidth, preset.maxHeight);

  if (!reposition) {
    clockWindow.setSize(preset.width, preset.height);
    if (persist) {
      saveClockWindowState({ sizeMode: mode, bounds: getWindowBoundsSnapshot(clockWindow) });
    }
    return;
  }

  const bounds = clockWindow.getBounds();
  const x = calculateAnchorX(bounds.x, bounds.width, preset.width);
  clockWindow.setBounds({ x, y: bounds.y, width: preset.width, height: preset.height });
  if (persist) {
    saveClockWindowState({ sizeMode: mode, bounds: getWindowBoundsSnapshot(clockWindow) });
  }
}

export function createClockWindow(): BrowserWindow {
  console.log("Creating clock window");

  // Don't create multiple clock windows
  if (clockWindow && !clockWindow.isDestroyed()) {
    console.log("Reusing existing clock window");
    return clockWindow;
  }

  const savedState = getClockWindowState();
  isPinned = savedState.isPinned ?? isPinned;
  currentSizeMode = savedState.sizeMode ?? currentSizeMode;

  const preload = path.join(__dirname, "./preload/clock.js");
  console.log("Clock: Preload path:", preload);

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Clock window dimensions - consistent for both idle and active states
  const initialPreset = getSizePreset(currentSizeMode);
  const savedBounds = savedState.bounds;
  const windowWidth = savedBounds?.width ?? initialPreset.width;
  const windowHeight = savedBounds?.height ?? initialPreset.height;

  // Position in top-right corner with some margin
  const defaultX = screenWidth - windowWidth - 20;
  const defaultY = 20;
  const x = savedBounds?.x ?? defaultX;
  const y = savedBounds?.y ?? defaultY;

  // Platform-specific options for cross-platform compatibility
  const platformOptions: Partial<Electron.BrowserWindowConstructorOptions> = {};

  // macOS-specific visual effects
  if (process.platform === 'darwin') {
    platformOptions.vibrancy = "under-window";
    platformOptions.visualEffectState = "active";
  }

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
    minWidth: initialPreset.minWidth,
    minHeight: initialPreset.minHeight,
    maxWidth: initialPreset.maxWidth,
    maxHeight: initialPreset.maxHeight,
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
    ...platformOptions, // Apply platform-specific options
  });

  applySizeMode(currentSizeMode, false);

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

  applySizeMode(currentSizeMode, false, false);
  if (savedBounds) {
    clockWindow.setBounds(savedBounds);
  }

  clockWindow.on("move", scheduleBoundsSave);
  clockWindow.on("resize", scheduleBoundsSave);
  clockWindow.on("close", () => {
    if (clockWindow && !clockWindow.isDestroyed()) {
      saveClockWindowState({ bounds: getWindowBoundsSnapshot(clockWindow) });
    }
    if (boundsSaveTimeout) {
      clearTimeout(boundsSaveTimeout);
      boundsSaveTimeout = null;
    }
  });

  // Handle window events
  clockWindow.on("closed", () => {
    console.log("Clock window closed");
    clockWindow = null;
    isClockVisible = false;
    if (boundsSaveTimeout) {
      clearTimeout(boundsSaveTimeout);
      boundsSaveTimeout = null;
    }
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
    // Re-enable mouse events before showing
    clockWindow.setIgnoreMouseEvents(false);
    clockWindow.show();
    clockWindow.focus();
    isClockVisible = true;

    // Set always-on-top with platform-safe error handling
    try {
      if (process.platform === 'darwin') {
        clockWindow.setAlwaysOnTop(isPinned, "screen-saver");
      } else {
        clockWindow.setAlwaysOnTop(isPinned);
      }
    } catch (error) {
      logger.warn("Clock: Failed to set always-on-top", { error, isPinned });
    }
  }
}

export function hideClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed() && isClockVisible) {
    console.log("Hiding clock window");
    // Release mouse events before hiding to prevent ghost regions
    clockWindow.setIgnoreMouseEvents(true);
    clockWindow.hide();
    isClockVisible = false;
  }
}

export function closeClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed()) {
    console.log("Closing clock window");
    // Release mouse events before closing to prevent ghost regions
    clockWindow.setIgnoreMouseEvents(true);
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
      try {
        if (process.platform === 'darwin') {
          clockWindow.setAlwaysOnTop(isPinned, "screen-saver");
        } else {
          clockWindow.setAlwaysOnTop(isPinned);
        }
        if (isPinned) {
          clockWindow.moveTop();
        }
      } catch (error) {
        logger.warn("Clock: Failed to toggle always-on-top", { error, isPinned });
      }
    }
    saveClockWindowState({ isPinned });
    return { isPinned, sizeMode: currentSizeMode };
  });

  ipcMain.handle(CLOCK_GET_STATE_CHANNEL, () => {
    return {
      isPinned,
      isVisible: isClockWindowVisible(),
      bounds: clockWindow?.getBounds() ?? getClockWindowState().bounds ?? null,
      sizeMode: currentSizeMode,
    };
  });

  ipcMain.handle(CLOCK_SET_SIZE_MODE_CHANNEL, (_event, mode: ClockSizeMode) => {
    if (mode !== "detailed" && mode !== "minimal") {
      throw new Error(`Unsupported clock size mode: ${mode}`);
    }
    applySizeMode(mode);
    return {
      sizeMode: currentSizeMode,
    };
  });
}

registerClockIpcHandlers();

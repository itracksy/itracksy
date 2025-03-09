import * as path from "path";

import { app, BrowserWindow, Tray, Menu, nativeImage, Notification } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import registerListeners from "./helpers/ipc/listeners-register";
import { router } from "./api";
import { initializeDatabase } from "./api/db/init";
import { createContext } from "./api/trpc";

import { logger } from "./helpers/logger";
import { startTracking } from "./api/services/activity";

const inDevelopment: boolean = process.env.NODE_ENV === "development";
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting: boolean = false;

/**
 * Get the tray instance
 * @returns The tray instance or null if not created yet
 */
export function getTray(): Tray | null {
  return tray;
}

async function createTray() {
  // Request notification permission on macOS
  if (process.platform === "darwin") {
    await app.whenReady();
    if (!Notification.isSupported()) {
      logger.debug("Notifications not supported");
    }
  }

  // Get the correct path to the resources directory
  let iconPath: string;
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // In development mode, use the root project directory
    const rootDir = path.resolve(path.join(__dirname, "..", ".."));
    iconPath =
      process.platform === "win32"
        ? path.join(rootDir, "resources", "icon.ico")
        : path.join(rootDir, "resources", "icon_16x16.png");
  } else {
    // In production mode
    if (process.platform === "darwin") {
      // For macOS, use the Contents/Resources directory
      iconPath = path.join(process.resourcesPath, "icon_16x16.png");
      logger.debug("Main: Using macOS production path:", iconPath);
    } else {
      // For Windows and other platforms
      iconPath = path.join(__dirname, "../resources/icon.ico");
    }
  }

  logger.debug("Main: Icon path", iconPath);

  // Check if file exists
  const fs = require("fs");
  if (fs.existsSync(iconPath)) {
    logger.debug("Main: Icon file exists at path", iconPath);
  } else {
    logger.error("Main: Icon file does not exist at path", iconPath);
    logger.debug("Main: __dirname value:", __dirname);
    logger.debug("Main: Resolved absolute path:", path.resolve(iconPath));

    // Try alternative paths for macOS
    if (process.platform === "darwin" && !isDev) {
      const altPaths = [
        path.join(process.resourcesPath, "resources", "icon_16x16.png"),
        path.join(app.getAppPath(), "resources", "icon_16x16.png"),
        path.join(__dirname, "../../resources/icon_16x16.png"),
      ];

      for (const altPath of altPaths) {
        logger.debug("Main: Trying alternative path:", altPath);
        if (fs.existsSync(altPath)) {
          iconPath = altPath;
          logger.debug("Main: Found icon at alternative path:", iconPath);
          break;
        }
      }
    }

    // List directory contents to debug
    try {
      const resourcesDir = path.dirname(iconPath);
      logger.debug("Main: Checking resources directory:", resourcesDir);
      const files = fs.readdirSync(resourcesDir);
      logger.debug("Main: Resources directory contents:", files);
    } catch (err) {
      logger.error("Main: Error reading resources directory:", err);
    }
  }

  const icon = nativeImage.createFromPath(iconPath);
  logger.debug("Main: Created nativeImage, isEmpty:", icon.isEmpty());

  // Handle macOS icon properly
  if (process.platform === "darwin") {
    // Create a proper sized icon for macOS
    const resizedIcon = icon.resize({ width: 16, height: 16 });
    resizedIcon.setTemplateImage(true);
    tray = new Tray(resizedIcon);
  } else {
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("iTracksy");

  tray.setTitle("");

  tray.on("click", () => {
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow(): void {
  const preload = path.join(__dirname, "preload.js");
  const iconPath = path.join(__dirname, "../resources/icon.ico");
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    icon: iconPath,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    titleBarStyle: "hidden",
  });

  createIPCHandler({
    router,
    windows: [mainWindow],
    createContext,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  registerListeners(mainWindow, tray);

  mainWindow.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

// Initialize app when ready
app.whenReady().then(async () => {
  try {
    logger.clearLogFile();
    await initializeDatabase();
    startTracking();
  } catch (error) {
    logger.error("[app.whenReady] Failed to initialize database:", error);
  }

  await createTray();
  createWindow();
});

// Handle app quit
app.on("before-quit", () => {
  isQuiting = true;
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

export {};

//osX only ends
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
// plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
// whether you're running in development or production).
export declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
export declare const MAIN_WINDOW_VITE_NAME: string;
// Preload types
interface ThemeModeContext {
  toggle: () => Promise<boolean>;
  dark: () => Promise<void>;
  light: () => Promise<void>;
  system: () => Promise<boolean>;
  current: () => Promise<"dark" | "light" | "system">;
}
interface ElectronWindow {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  updateTrayTitle: (title: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ status: "success" | "error"; message: string }>;
  getLogFileContent: () => Promise<string>;
}

declare global {
  interface Window {
    themeMode: ThemeModeContext;
    electronWindow: ElectronWindow;
  }
}

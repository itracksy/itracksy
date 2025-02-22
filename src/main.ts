import * as path from "path";

import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, powerMonitor } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import registerListeners from "./helpers/ipc/listeners-register";
import { router } from "./api";
import { initializeDatabase } from "./api/db/init";
import { createContext } from "./api/trpc";

import { logger } from "./helpers/logger";
import { getActiveTimeEntry, updateTimeEntry } from "./api/services/timeEntry";
import { startTracking, stopTracking } from "./api/services/activity";
import { getCurrentUserIdLocalStorage } from "./api/db/repositories/userSettings";
import { MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME } from "./electronWindowType";

const inDevelopment: boolean = process.env.NODE_ENV === "development";
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting: boolean = false;

async function createTray() {
  // Request notification permission on macOS
  if (process.platform === "darwin") {
    await app.whenReady();
    if (!Notification.isSupported()) {
      logger.debug("Notifications not supported");
    }
  }

  const iconPath =
    process.platform === "win32"
      ? path.join(__dirname, "../resources/icon.ico")
      : path.join(__dirname, "../resources/icon.png");
  logger.debug("Main: Icon path", iconPath);
  const icon = nativeImage.createFromPath(iconPath);
  // Remove resize for Windows
  if (process.platform === "darwin") {
    icon.resize({ width: 18, height: 18 });
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);

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

  tray.setTitle("iTracksy");

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
    width: 1200,
    height: 800,
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

const stopTimeEntry = async () => {
  const entry = await getActiveTimeEntry();
  if (entry) {
    await updateTimeEntry(entry.id, { endTime: new Date().toISOString() });
  }
  stopTracking();
};

powerMonitor.on("suspend", stopTimeEntry);
powerMonitor.on("lock-screen", stopTimeEntry);

const startTrackingOnResume = async () => {
  const userId = await getCurrentUserIdLocalStorage();
  if (userId) {
    startTracking(userId);
  }
};

powerMonitor.on("resume", startTrackingOnResume);
powerMonitor.on("unlock-screen", startTrackingOnResume);
export {};

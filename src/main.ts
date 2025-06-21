import * as path from "path";

import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  Notification,
  session,
  ipcMain,
  dialog,
} from "electron";
import { createIPCHandler } from "electron-trpc/main";
import registerListeners from "./helpers/ipc/listeners-register";
import { router } from "./api";
import { initializeDatabase } from "./api/db/init";
import { createContext } from "./api/trpc";

import { logger } from "./helpers/logger";
import { startTracking } from "./api/services/trackingIntervalActivity";
import { toggleClockWindow } from "./main/windows/clock";
import {
  checkAccessibilityPermission,
  checkScreenRecordingPermission,
  requestAccessibilityPermission,
  requestScreenRecordingPermission,
} from "./api/services/userSettings";

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

/**
 * Show and focus the main window
 */
export function showMainWindow(): void {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
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

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show iTracksy",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Show Clock",
      click: () => {
        toggleClockWindow();
      },
    },
    { type: "separator" },
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
  console.log("Main: Preload path:", preload);
  const iconPath = path.join(__dirname, "../resources/icon.ico");
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    icon: iconPath,
    movable: true,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    // Apply different title bar styles based on the OS
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hidden" }
      : {
          frame: false, // Use frameless window on Windows
          titleBarStyle: "default", // Default title bar style for Windows
        }),
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
    const mainPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    logger.info("Main: Loading main window from:", mainPath);
    logger.info("Main: MAIN_WINDOW_VITE_NAME:", MAIN_WINDOW_VITE_NAME);
    mainWindow.loadFile(mainPath);
  }

  registerListeners(mainWindow, tray);

  mainWindow.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

/**
 * Check and request necessary macOS permissions for browser URL tracking
 */
async function checkAndRequestPermissions(): Promise<void> {
  // Only check permissions on macOS
  if (process.platform !== "darwin") {
    logger.debug("Not on macOS, skipping permission checks");
    return;
  }

  logger.debug("Checking macOS permissions for browser URL tracking");

  const hasAccessibility = checkAccessibilityPermission();
  const hasScreenRecording = checkScreenRecordingPermission();

  logger.debug("Permission status:", { hasAccessibility, hasScreenRecording });

  // If both permissions are already granted, no need to show dialog
  if (hasAccessibility && hasScreenRecording) {
    logger.debug("All permissions already granted");
    return;
  }

  // Show dialog explaining why permissions are needed
  const permissionsNeeded = [];
  if (!hasAccessibility) permissionsNeeded.push("Accessibility");
  if (!hasScreenRecording) permissionsNeeded.push("Screen Recording");

  const response = await dialog.showMessageBox({
    type: "info",
    title: "Permissions Required",
    message: "iTracksy needs system permissions to track browser activity",
    detail: `To track browser URLs and provide accurate time tracking, iTracksy requires the following macOS permissions:\n\n• ${permissionsNeeded.join("\n• ")}\n\nThese permissions allow the app to:\n- Detect which applications you're using\n- Extract browser URLs for website tracking\n- Provide detailed activity reports\n\nYour privacy is protected - all data stays on your device.`,
    buttons: ["Grant Permissions", "Skip for Now"],
    defaultId: 0,
    cancelId: 1,
  });

  if (response.response === 0) {
    // User chose to grant permissions
    logger.debug("User chose to grant permissions");

    if (!hasAccessibility) {
      logger.debug("Requesting Accessibility permission");
      await requestAccessibilityPermission();
    }

    if (!hasScreenRecording) {
      logger.debug("Requesting Screen Recording permission");
      await requestScreenRecordingPermission();
    }

    // Show follow-up dialog with instructions
    await dialog.showMessageBox({
      type: "info",
      title: "Permission Setup Complete",
      message: "System Preferences has been opened",
      detail:
        "Please:\n\n1. Add iTracksy to the permission lists\n2. Enable the checkboxes next to iTracksy\n3. Restart the app for changes to take effect\n\nNote: You may need to restart iTracksy after granting permissions for them to take effect.",
      buttons: ["OK"],
    });
  } else {
    logger.debug("User chose to skip permissions");

    // Show warning about limited functionality
    await dialog.showMessageBox({
      type: "warning",
      title: "Limited Functionality",
      message: "Some features will be unavailable",
      detail:
        "Without these permissions, iTracksy cannot:\n• Track browser URLs\n• Provide detailed website analytics\n• Classify web-based activities\n\nYou can grant these permissions later in the Settings page.",
      buttons: ["OK"],
    });
  }
}

// Initialize app when ready
app.whenReady().then(async () => {
  try {
    logger.clearLogFile();
    await initializeDatabase();

    // Check and request permissions before starting tracking
    await checkAndRequestPermissions();

    startTracking();
  } catch (error) {
    logger.error("[app.whenReady] Failed to initialize database:", error);
  }

  await createTray();
  createWindow();

  // Modify CSP to allow scripts from PostHog and inline scripts
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://*.posthog.com; " +
            "connect-src 'self' https://*.posthog.com; " +
            "img-src 'self' data: https://*.posthog.com; " +
            "style-src 'self' 'unsafe-inline'; " +
            "frame-src 'self' https://*.itracksy.com https://www.itracksy.com;",
        ],
      },
    });
  });

  // Filter and block specific PostHog requests that are not needed
  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        "https://*.posthog.com/static/surveys.js*",
        "https://*.posthog.com/static/toolbar.js*",
        "https://*.posthog.com/static/recorder.js*",
      ],
    },
    (details, callback) => {
      // Block these specific requests
      callback({ cancel: true });
    }
  );

  // Check and request Accessibility and Screen Recording permissions on macOS
  if (process.platform === "darwin") {
    const accessibilityGranted = await checkAccessibilityPermission();
    const screenRecordingGranted = await checkScreenRecordingPermission();

    if (!accessibilityGranted) {
      const result = await dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        title: "Accessibility Permission Required",
        message:
          "iTracksy requires Accessibility permissions to function correctly. Please enable it in System Preferences > Security & Privacy > Privacy > Accessibility.",
      });
      if (result.response === 0) {
        // Open System Preferences if the user clicks OK
        const { exec } = require("child_process");
        exec(
          "open 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'"
        );
      }
    }

    if (!screenRecordingGranted) {
      const result = await dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        title: "Screen Recording Permission Required",
        message:
          "iTracksy requires Screen Recording permissions to function correctly. Please enable it in System Preferences > Security & Privacy > Privacy > Screen Recording.",
      });
      if (result.response === 0) {
        // Open System Preferences if the user clicks OK
        const { exec } = require("child_process");
        exec(
          "open 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenRecording'"
        );
      }
    }
  }

  // Check and request additional permissions for browser URL tracking
  await checkAndRequestPermissions();
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
  checkForUpdates: () => Promise<{
    status: "success" | "error";
    message: string;
    hasUpdate: boolean;
    currentVersion?: string;
    latestVersion?: string;
    downloadUrl?: string;
  }>;
  getLogFileContent: () => Promise<string>;
}

declare global {
  interface Window {
    themeMode: ThemeModeContext;
    electronWindow: ElectronWindow;
    electronNotification?: {
      send: (data: any) => Promise<void>;
      close: () => Promise<void>;
      action: () => Promise<void>;
      onNotification: (callback: (data: any) => void) => void;
    };
  }
}

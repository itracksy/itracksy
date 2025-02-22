import { BrowserWindow, app, dialog, ipcMain, screen, Tray } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_GET_APP_VERSION_CHANNEL,
  WIN_CHECK_UPDATES_CHANNEL,
  WIN_GET_LOG_FILE_CONTENT_CHANNEL,
} from "./window-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";

import { logger } from "../../../helpers/logger";

let mainWindowRef: BrowserWindow | null = null;
let trayRef: Tray | null = null;

export const addWindowEventListeners = (mainWindow: BrowserWindow, tray: Tray | null) => {
  logger.debug("WindowListeners: Adding listeners", { hasTray: !!tray });
  mainWindowRef = mainWindow;
  trayRef = tray;
  // Register window event handlers
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => mainWindow?.minimize());
  safelyRegisterListener(WIN_GET_APP_VERSION_CHANNEL, () => {
    return app.getVersion();
  });

  safelyRegisterListener(WIN_CHECK_UPDATES_CHANNEL, async () => {
    try {
      logger.info("Checking for updates...");
      // Implement your update check logic here
      // For example, if using electron-updater:
      // await autoUpdater.checkForUpdates();
      return { status: "success", message: "Update check completed" };
    } catch (error) {
      logger.error("Failed to check for updates", error);
      throw error;
    }
  });
  safelyRegisterListener(WIN_GET_LOG_FILE_CONTENT_CHANNEL, async () => {
    try {
      const logFileContent = await logger.getFileContent();
      return logFileContent;
    } catch (error) {
      logger.error("Failed to get log file content", error);
      throw error;
    }
  });
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => {
    try {
      mainWindow.minimize();
    } catch (error) {
      logger.error("Failed to minimize window", { error });
    }
  });

  safelyRegisterListener(WIN_MAXIMIZE_CHANNEL, () => {
    try {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    } catch (error) {
      logger.error("Failed to maximize/unmaximize window", { error });
    }
  });

  safelyRegisterListener(WIN_CLOSE_CHANNEL, () => {
    try {
      mainWindow.close();
    } catch (error) {
      logger.error("Failed to close window", { error });
    }
  });

  safelyRegisterListener(WIN_UPDATE_TRAY_TITLE_CHANNEL, (_event, title: string) => {
    try {
      if (trayRef) {
        trayRef.setTitle(title);
      }
    } catch (error) {
      logger.error("Failed to update tray title", { error, title });
    }
  });
};

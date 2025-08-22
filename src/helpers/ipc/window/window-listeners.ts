import { BrowserWindow, Tray } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL,
} from "./window-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";

import { logger } from "../../../helpers/logger";
import { hideClockWindow } from "../../../main/windows/clock";

let trayRef: Tray | null = null;

export const addWindowEventListeners = (mainWindow: BrowserWindow, tray: Tray | null) => {
  logger.debug("WindowListeners: Adding listeners", { hasTray: !!tray });

  trayRef = tray;
  // Register window event handlers
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => mainWindow?.minimize());
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

  safelyRegisterListener(
    WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL,
    async (_event, isVisible: boolean) => {
      try {
        // When clock visibility is disabled, hide the clock window
        if (!isVisible) {
          hideClockWindow();
        }
        // When enabled, don't show it immediately - it will show on next new session
        return { success: true };
      } catch (error) {
        logger.error("Failed to handle clock visibility change", { error, isVisible });
        throw error;
      }
    }
  );
};

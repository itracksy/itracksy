import { BrowserWindow, app, Tray } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
  WIN_UPDATE_TRAY_TITLE_CHANNEL,
  WIN_GET_APP_VERSION_CHANNEL,
  WIN_CHECK_UPDATES_CHANNEL,
  WIN_GET_LOG_FILE_CONTENT_CHANNEL,
  WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL,
} from "./window-channels";

import { safelyRegisterListener } from "../safelyRegisterListener";

import { logger } from "../../../helpers/logger";
import { getPlatformDownloadUrl } from "./handleDownload";
import { hideClockWindow } from "../../../main/windows/clock";

let trayRef: Tray | null = null;

export const addWindowEventListeners = (mainWindow: BrowserWindow, tray: Tray | null) => {
  logger.debug("WindowListeners: Adding listeners", { hasTray: !!tray });

  trayRef = tray;
  // Register window event handlers
  safelyRegisterListener(WIN_MINIMIZE_CHANNEL, () => mainWindow?.minimize());
  safelyRegisterListener(WIN_GET_APP_VERSION_CHANNEL, () => {
    return app.getVersion();
  });

  safelyRegisterListener(WIN_CHECK_UPDATES_CHANNEL, async () => {
    try {
      logger.info("Checking for updates...");
      const currentVersion = app.getVersion();
      logger.info(`Current app version: ${currentVersion}`);

      // Fetch the latest release from GitHub
      const response = await fetch(
        "https://api.github.com/repos/itracksy/itracksy/releases/latest"
      );

      if (!response.ok) {
        logger.error(`Failed to fetch latest release: ${response.statusText}`);
        return {
          status: "error",
          message: "Failed to check for updates. Please try again later.",
          hasUpdate: false,
        };
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace("v", "");
      const downloadUrl = getPlatformDownloadUrl(latestVersion);

      logger.info(`Latest version available: ${latestVersion}`);

      // Compare versions (simple string comparison, assuming semver format)
      const hasUpdate = latestVersion > currentVersion;

      return {
        status: "success",
        message: hasUpdate
          ? `Update available: ${latestVersion}`
          : "You are using the latest version.",
        hasUpdate,
        currentVersion,
        latestVersion,
        downloadUrl,
      };
    } catch (error) {
      logger.error("Failed to check for updates", error);
      return {
        status: "error",
        message: "Failed to check for updates. Please try again later.",
        hasUpdate: false,
      };
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

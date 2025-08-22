import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { logger } from "../../helpers/logger";

/**
 * Cross-platform auto-start service for iTracksy
 * Handles auto-start functionality for macOS, Windows, and Linux
 */

export interface AutoStartOptions {
  openAtLogin: boolean;
  openAsHidden?: boolean;
  path?: string;
  args?: string[];
}

/**
 * Get current auto-start status across all platforms
 */
export function getAutoStartStatus(): AutoStartOptions {
  try {
    if (process.platform === "darwin" || process.platform === "win32") {
      // Use Electron's built-in API for macOS and Windows
      const loginItemSettings = app.getLoginItemSettings();
      return {
        openAtLogin: loginItemSettings.openAtLogin,
        openAsHidden: loginItemSettings.openAsHidden,
      };
    } else if (process.platform === "linux") {
      // Check Linux autostart directory
      return {
        openAtLogin: isLinuxAutoStartEnabled(),
        openAsHidden: false,
      };
    }
  } catch (error) {
    logger.error("Failed to get auto-start status:", error);
  }

  return { openAtLogin: false };
}

/**
 * Enable or disable auto-start functionality
 */
export function setAutoStart(enable: boolean, options: Partial<AutoStartOptions> = {}): boolean {
  try {
    logger.info(`Setting auto-start to: ${enable}`);

    if (process.platform === "darwin" || process.platform === "win32") {
      // Use Electron's built-in API for macOS and Windows
      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: options.openAsHidden ?? false,
        path: options.path,
        args: options.args,
      });

      // Verify the setting was applied
      const currentSettings = app.getLoginItemSettings();
      const success = currentSettings.openAtLogin === enable;
      
      if (success) {
        logger.info(`Auto-start ${enable ? "enabled" : "disabled"} successfully for ${process.platform}`);
      } else {
        logger.error("Failed to verify auto-start setting");
      }
      
      return success;
    } else if (process.platform === "linux") {
      // Handle Linux autostart
      return setLinuxAutoStart(enable);
    }
  } catch (error) {
    logger.error("Failed to set auto-start:", error);
  }

  return false;
}

/**
 * Check if auto-start is enabled on Linux
 */
function isLinuxAutoStartEnabled(): boolean {
  try {
    const autostartDir = path.join(os.homedir(), ".config", "autostart");
    const desktopFile = path.join(autostartDir, "itracksy.desktop");
    return fs.existsSync(desktopFile);
  } catch (error) {
    logger.error("Failed to check Linux auto-start status:", error);
    return false;
  }
}

/**
 * Enable or disable auto-start on Linux by managing .desktop file
 */
function setLinuxAutoStart(enable: boolean): boolean {
  try {
    const autostartDir = path.join(os.homedir(), ".config", "autostart");
    const desktopFile = path.join(autostartDir, "itracksy.desktop");

    if (enable) {
      // Create autostart directory if it doesn't exist
      if (!fs.existsSync(autostartDir)) {
        fs.mkdirSync(autostartDir, { recursive: true });
      }

      // Get the executable path
      const execPath = process.execPath;
      const appName = app.getName();
      const appVersion = app.getVersion();

      // Create desktop file content
      const desktopFileContent = `[Desktop Entry]
Type=Application
Version=${appVersion}
Name=${appName}
Comment=Time tracking and productivity app
Exec=${execPath}
StartupNotify=false
Terminal=false
Hidden=false
Categories=Productivity;Office;
X-GNOME-Autostart-enabled=true
`;

      // Write the desktop file
      fs.writeFileSync(desktopFile, desktopFileContent);
      logger.info("Linux auto-start enabled: Created .desktop file");
      return true;
    } else {
      // Remove the desktop file if it exists
      if (fs.existsSync(desktopFile)) {
        fs.unlinkSync(desktopFile);
        logger.info("Linux auto-start disabled: Removed .desktop file");
      }
      return true;
    }
  } catch (error) {
    logger.error("Failed to set Linux auto-start:", error);
    return false;
  }
}

/**
 * Toggle auto-start status
 */
export function toggleAutoStart(): boolean {
  const currentStatus = getAutoStartStatus();
  return setAutoStart(!currentStatus.openAtLogin);
}

/**
 * Initialize auto-start functionality
 * This should be called during app startup
 */
export function initializeAutoStart(): void {
  logger.info("Initializing auto-start functionality");
  
  try {
    const currentStatus = getAutoStartStatus();
    logger.info("Current auto-start status:", currentStatus);

    // On first run, we could optionally prompt the user or set a default
    // For now, we just log the current status
    
    // Handle Squirrel events on Windows
    if (process.platform === "win32") {
      handleSquirrelEvents();
    }
  } catch (error) {
    logger.error("Failed to initialize auto-start:", error);
  }
}

/**
 * Handle Squirrel installer events on Windows
 */
function handleSquirrelEvents(): void {
  const squirrelStartup = require("electron-squirrel-startup");
  
  if (squirrelStartup) {
    logger.info("Squirrel event detected, app will quit");
    return;
  }

  // Handle additional Squirrel events
  if (process.argv.length > 1) {
    const squirrelEvent = process.argv[1];
    
    switch (squirrelEvent) {
      case "--squirrel-install":
      case "--squirrel-updated":
        // Install or update event - we could enable auto-start here
        logger.info("Squirrel install/update event");
        // Optionally enable auto-start on install
        // setAutoStart(true);
        app.quit();
        return;
        
      case "--squirrel-uninstall":
        // Uninstall event - clean up auto-start
        logger.info("Squirrel uninstall event");
        setAutoStart(false);
        app.quit();
        return;
        
      case "--squirrel-obsolete":
        // Obsolete version event
        logger.info("Squirrel obsolete event");
        app.quit();
        return;
    }
  }
}

/**
 * Utility function to check if the current platform supports auto-start
 */
export function isAutoStartSupported(): boolean {
  return ["darwin", "win32", "linux"].includes(process.platform);
}

/**
 * Get platform-specific auto-start information
 */
export function getAutoStartInfo(): {
  platform: string;
  supported: boolean;
  method: string;
  status: AutoStartOptions;
} {
  const platform = process.platform;
  const supported = isAutoStartSupported();
  let method = "Not supported";

  if (platform === "darwin") {
    method = "macOS Login Items";
  } else if (platform === "win32") {
    method = "Windows Registry / Squirrel";
  } else if (platform === "linux") {
    method = "XDG Autostart (.desktop file)";
  }

  return {
    platform,
    supported,
    method,
    status: getAutoStartStatus(),
  };
}

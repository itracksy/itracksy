import { powerMonitor } from "electron";
import { logger } from "../../helpers/logger";
import { IDLE_THRESHOLD_MINUTES, SYSTEM_MONITOR_CHECK_INTERVAL } from "../../config/tracking";

let isSystemIdle = false;
let isSystemLocked = false;
let systemStateListeners: Array<(isActive: boolean) => void> = [];

/**
 * Initialize system state monitoring for macOS
 * Detects when the system goes idle, sleeps, or user logs out
 */
export const initializeSystemMonitor = (): void => {
  // Monitor system sleep/resume
  powerMonitor.on("suspend", () => {
    logger.info("[SystemMonitor] System is going to sleep");
    handleSystemInactive();
  });

  powerMonitor.on("resume", () => {
    logger.info("[SystemMonitor] System resumed from sleep");
    handleSystemActive();
  });

  // Monitor system lock/unlock (macOS specific)
  powerMonitor.on("lock-screen", () => {
    logger.info("[SystemMonitor] Screen locked");
    isSystemLocked = true;
    handleSystemInactive();
  });

  powerMonitor.on("unlock-screen", () => {
    logger.info("[SystemMonitor] Screen unlocked");
    isSystemLocked = false;
    handleSystemActive();
  });

  // Monitor system idle state
  // Check periodically if system has been idle for more than the threshold
  setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    const IDLE_THRESHOLD = IDLE_THRESHOLD_MINUTES * 60; // Convert to seconds

    const wasIdle = isSystemIdle;
    isSystemIdle = idleTime >= IDLE_THRESHOLD;

    if (!wasIdle && isSystemIdle) {
      logger.info(`[SystemMonitor] System became idle (${Math.floor(idleTime / 60)} minutes)`);
      handleSystemInactive();
    } else if (wasIdle && !isSystemIdle) {
      logger.info("[SystemMonitor] System became active from idle state");
      handleSystemActive();
    }
  }, SYSTEM_MONITOR_CHECK_INTERVAL);

  logger.info("[SystemMonitor] System monitoring initialized");
};

/**
 * Handle when system becomes inactive (sleep, lock, or idle)
 */
const handleSystemInactive = (): void => {
  logger.info("[SystemMonitor] System became inactive - notifying listeners");
  notifyListeners(false);
};

/**
 * Handle when system becomes active (resume, unlock, or user activity)
 */
const handleSystemActive = (): void => {
  // Only notify if system is truly active (not locked and not idle)
  if (!isSystemLocked && !isSystemIdle) {
    logger.info("[SystemMonitor] System became active - notifying listeners");
    notifyListeners(true);
  }
};

/**
 * Notify all registered listeners about system state change
 */
const notifyListeners = (isActive: boolean): void => {
  systemStateListeners.forEach((listener) => {
    try {
      listener(isActive);
    } catch (error) {
      logger.error("[SystemMonitor] Error in system state listener", { error });
    }
  });
};

/**
 * Register a listener for system state changes
 * @param listener Function to call when system becomes active/inactive
 * @returns Unsubscribe function
 */
export const onSystemStateChange = (listener: (isActive: boolean) => void): (() => void) => {
  systemStateListeners.push(listener);

  // Return unsubscribe function
  return () => {
    const index = systemStateListeners.indexOf(listener);
    if (index > -1) {
      systemStateListeners.splice(index, 1);
    }
  };
};

/**
 * Get current system state
 */
export const getSystemState = (): { isIdle: boolean; isLocked: boolean; isActive: boolean } => {
  return {
    isIdle: isSystemIdle,
    isLocked: isSystemLocked,
    isActive: !isSystemIdle && !isSystemLocked,
  };
};

/**
 * Check if system is currently active (not idle, not locked, not sleeping)
 */
export const isSystemActive = (): boolean => {
  return !isSystemIdle && !isSystemLocked;
};

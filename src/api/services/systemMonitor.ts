import { powerMonitor } from "electron";
import { logger } from "../../helpers/logger";

let isSystemLocked = false;
let isSystemSleeping = false;
const systemStateListeners: Array<(isActive: boolean) => void> = [];

/**
 * Initialize system state monitoring
 * Only pauses session on system lock, sleep, or standby (NOT on idle)
 */
export const initializeSystemMonitor = (): void => {
  // Monitor system sleep/resume
  powerMonitor.on("suspend", () => {
    logger.info("[SystemMonitor] System is going to sleep");
    isSystemSleeping = true;
    handleSystemInactive();
  });

  powerMonitor.on("resume", () => {
    logger.info("[SystemMonitor] System resumed from sleep");
    isSystemSleeping = false;
    handleSystemActive();
  });

  // Monitor system lock/unlock
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

  // Note: We intentionally do NOT monitor idle state
  // Session should only pause on lock/sleep, not when user is reading/thinking

  logger.info("[SystemMonitor] System monitoring initialized (lock/sleep only)");
};

/**
 * Handle when system becomes inactive (sleep or lock)
 */
const handleSystemInactive = (): void => {
  logger.info("[SystemMonitor] System became inactive - notifying listeners");
  notifyListeners(false);
};

/**
 * Handle when system becomes active (resume or unlock)
 */
const handleSystemActive = (): void => {
  // Only notify if system is truly active (not locked and not sleeping)
  if (!isSystemLocked && !isSystemSleeping) {
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
export const getSystemState = (): { isLocked: boolean; isSleeping: boolean; isActive: boolean } => {
  return {
    isLocked: isSystemLocked,
    isSleeping: isSystemSleeping,
    isActive: !isSystemLocked && !isSystemSleeping,
  };
};

/**
 * Check if system is currently active (not locked, not sleeping)
 */
export const isSystemActive = (): boolean => {
  return !isSystemLocked && !isSystemSleeping;
};

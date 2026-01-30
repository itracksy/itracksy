import db from "../db";
import { blockedDomains, blockedApps } from "../db/schema";
import { eq } from "drizzle-orm";
import { shell, systemPreferences } from "electron";
import { getValue, setValue } from "./localStorage";
import { logger } from "../../helpers/logger";
import { boards } from "../db/schema";
import { createBoard, createColumn, createItem } from "../services/board";
import { nanoid } from "nanoid";
import type { UserPreferences } from "../../lib/types/user-preferences";
import { DEFAULT_USER_PREFERENCES } from "../../lib/types/user-preferences";

const USER_SETTINGS_KEYS = {
  isWarningPopupEnable: "user.isWarningPopupEnable",
  isClockVisible: "user.isClockVisible",
  isTimeExceededNotificationEnabled: "user.isTimeExceededNotificationEnabled",
  lastUpdateActivity: "user.lastUpdateActivity",
  currentUserId: "user.currentUserId",
  userPreferences: "user.preferences",
};

// Check if the platform is macOS
const isMacOS = process.platform === "darwin";

/**
 * Checks if accessibility permission is granted (macOS only)
 * @returns boolean indicating if permission is granted, true for non-macOS platforms
 */
export function checkAccessibilityPermission(): boolean {
  if (!isMacOS) return true;

  try {
    const hasPermission = systemPreferences.isTrustedAccessibilityClient(false);
    console.log("Accessibility Permission:", hasPermission);
    return hasPermission;
  } catch (error) {
    logger.error("[checkAccessibilityPermission] Error checking permission", { error });
    return false;
  }
}

/**
 * Checks if screen recording permission is granted (macOS only)
 * This uses the system API which can sometimes report "granted" even when
 * the actual screen capture doesn't work. Use verifyScreenRecordingPermission()
 * for a more reliable check.
 * @returns boolean indicating if permission is granted, true for non-macOS platforms
 */
export function checkScreenRecordingPermission(): boolean {
  if (!isMacOS) return true;

  try {
    return systemPreferences.getMediaAccessStatus("screen") === "granted";
  } catch (error) {
    logger.error("[checkScreenRecordingPermission] Error checking permission", { error });
    return false;
  }
}

// Cache for verified permission state
let lastVerifiedPermissionState: boolean | null = null;
let lastVerificationTime: number = 0;
const VERIFICATION_CACHE_MS = 30000; // Cache verification result for 30 seconds

/**
 * Verifies screen recording permission by actually attempting to get active window.
 * This is more reliable than checkScreenRecordingPermission() as it tests real functionality.
 * Results are cached for 30 seconds to avoid performance impact.
 * @returns Promise<boolean> indicating if permission actually works
 */
export async function verifyScreenRecordingPermission(): Promise<boolean> {
  if (!isMacOS) {
    logger.debug("[verifyScreenRecordingPermission] Non-macOS platform, returning true");
    return true;
  }

  // Return cached result if still valid
  const now = Date.now();
  if (lastVerifiedPermissionState !== null && now - lastVerificationTime < VERIFICATION_CACHE_MS) {
    logger.debug("[verifyScreenRecordingPermission] Returning cached result", {
      cachedState: lastVerifiedPermissionState,
      cacheAge: now - lastVerificationTime,
      cacheMaxAge: VERIFICATION_CACHE_MS,
    });
    return lastVerifiedPermissionState;
  }

  // First check the system API - if it says no, don't bother testing
  const systemSaysGranted = checkScreenRecordingPermission();
  logger.info("[verifyScreenRecordingPermission] System API check", {
    systemSaysGranted,
  });

  if (!systemSaysGranted) {
    logger.info(
      "[verifyScreenRecordingPermission] System API says not granted, skipping actual test"
    );
    lastVerifiedPermissionState = false;
    lastVerificationTime = now;
    return false;
  }

  // System says granted, but let's verify by actually trying to get a window
  logger.info(
    "[verifyScreenRecordingPermission] System says granted, performing actual verification test"
  );
  try {
    const getWindows = await import("get-windows");
    const result = await getWindows.activeWindow({
      accessibilityPermission: true,
      screenRecordingPermission: true,
    });
    // If we get here without error, permission works
    logger.info("[verifyScreenRecordingPermission] Actual test PASSED", {
      hasResult: !!result,
      resultOwner: result?.owner?.name,
    });
    lastVerifiedPermissionState = true;
    lastVerificationTime = now;
    return true;
  } catch (error) {
    // Check if this is a permission error
    const errorStdout =
      error && typeof error === "object" && "stdout" in error
        ? (error as { stdout: unknown }).stdout
        : null;
    const isPermissionError = Boolean(
      typeof errorStdout === "string" && errorStdout.includes("permission")
    );

    logger.warn("[verifyScreenRecordingPermission] Actual test failed", {
      isPermissionError,
      errorStdout: typeof errorStdout === "string" ? errorStdout.substring(0, 200) : null,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (isPermissionError) {
      logger.warn(
        "[verifyScreenRecordingPermission] MISMATCH: System reports granted but actual test failed - permission not working"
      );
      lastVerifiedPermissionState = false;
      lastVerificationTime = now;
      return false;
    }

    // Other errors (e.g., no window focused) don't indicate permission issues
    logger.info(
      "[verifyScreenRecordingPermission] Non-permission error (possibly no window focused), treating as success"
    );
    lastVerifiedPermissionState = true;
    lastVerificationTime = now;
    return true;
  }
}

/**
 * Reset the verified permission cache - call this when user toggles permissions
 */
export function resetPermissionVerificationCache(): void {
  logger.info("[resetPermissionVerificationCache] Resetting permission verification cache", {
    previousState: lastVerifiedPermissionState,
    previousTime: lastVerificationTime > 0 ? new Date(lastVerificationTime).toISOString() : null,
  });
  lastVerifiedPermissionState = null;
  lastVerificationTime = 0;
}

/**
 * Requests accessibility permission (macOS only)
 * @returns Promise resolving to boolean indicating success
 */
export async function requestAccessibilityPermission(): Promise<boolean> {
  if (!isMacOS) return true;

  try {
    // Open system preferences to the accessibility section
    await shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
    );
    return checkAccessibilityPermission();
  } catch (error) {
    logger.error("[requestAccessibilityPermission] Error requesting permission", { error });
    return false;
  }
}

/**
 * Requests screen recording permission (macOS only)
 * @returns Promise resolving to boolean indicating success
 */
export async function requestScreenRecordingPermission(): Promise<boolean> {
  if (!isMacOS) return true;

  try {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
    );
    return checkScreenRecordingPermission();
  } catch (error) {
    logger.error("[requestScreenRecordingPermission] Error requesting permission", { error });
    return false;
  }
}

export async function getUserSettings({ userId }: { userId: string }) {
  const [
    isWarningPopupEnable,
    isClockVisible,
    isTimeExceededNotificationEnabled,
    lastUpdateActivity,
  ] = await Promise.all([
    getValue(USER_SETTINGS_KEYS.isWarningPopupEnable),
    getValue(USER_SETTINGS_KEYS.isClockVisible),
    getValue(USER_SETTINGS_KEYS.isTimeExceededNotificationEnabled),
    getValue(USER_SETTINGS_KEYS.lastUpdateActivity),
  ]);

  return {
    isWarningPopupEnable: isWarningPopupEnable === "true",
    isClockVisible: isClockVisible !== "false", // Default to true
    isTimeExceededNotificationEnabled: isTimeExceededNotificationEnabled !== "false", // Default to true
    lastUpdateActivity: lastUpdateActivity ? parseInt(lastUpdateActivity) : null,
  };
}

let existingUserId: string | null = null;

export const getCurrentUserIdLocalStorage = async () => {
  if (!existingUserId) {
    existingUserId = await getValue(USER_SETTINGS_KEYS.currentUserId);
  }

  return existingUserId;
};

export async function setCurrentUserId(userId: string): Promise<string> {
  existingUserId = await getCurrentUserIdLocalStorage();
  if (existingUserId && existingUserId !== userId) {
    logger.fatal("[setCurrentUserId] Current user id mismatch", {
      existingUserId,
      userId,
    });
  }

  if (existingUserId == userId) {
    return existingUserId;
  }

  await setValue(USER_SETTINGS_KEYS.currentUserId, userId);
  existingUserId = userId;

  // Check if there are any boards
  const existingBoards = await db.select().from(boards);
  if (existingBoards.length === 0) {
    // Create default introduction board
    const board = await createBoard(
      {
        name: "Getting Started",
        color: "#4CAF50", // A nice green color
        currency: "USD",
        hourlyRate: 0,
      },
      userId
    );

    // Create default columns
    const todoColumn = await createColumn({
      name: "To Do",
      boardId: board.id,
      order: 0,
    });

    const inProgressColumn = await createColumn({
      name: "In Progress",
      boardId: board.id,
      order: 1,
    });

    const doneColumn = await createColumn({
      name: "Done",
      boardId: board.id,
      order: 2,
    });

    // Create introduction items
    await createItem({
      id: nanoid(),
      title: "👋 Welcome to iTracksy!",
      content:
        "iTracksy is your personal time tracking and task management companion. This board helps you get started with the basics.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 0,
    });

    await createItem({
      id: nanoid(),
      title: "⏱️ Track Your Time",
      content:
        "Click the play button on any task to start tracking time. You can also use focus mode to minimize distractions.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 1,
    });

    await createItem({
      id: nanoid(),
      title: "📊 View Reports",
      content:
        "Check out the dashboard to see insights about your time usage and productivity patterns.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 2,
    });

    await createItem({
      id: nanoid(),
      title: "🎯 Create Your First Task",
      content:
        "Click the + button in any column to create a new task. Try moving this task to 'In Progress' when you start!",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 3,
    });
  }

  await setValue(USER_SETTINGS_KEYS.isWarningPopupEnable, "true");
  await setValue(USER_SETTINGS_KEYS.isTimeExceededNotificationEnabled, "true");

  return existingUserId;
}

export async function setPermissions({
  accessibilityPermission,
  screenRecordingPermission,
}: {
  accessibilityPermission: boolean;
  screenRecordingPermission: boolean;
}) {
  if (accessibilityPermission === true) {
    await requestAccessibilityPermission();
  }
  if (screenRecordingPermission === true) {
    await requestScreenRecordingPermission();
  }
}
export async function getPermissions() {
  const accessibilityPermission = checkAccessibilityPermission();
  const screenRecordingPermission = checkScreenRecordingPermission();
  return { accessibilityPermission, screenRecordingPermission };
}

/**
 * Get detailed permission status with explanations (sync version using system API)
 */
export function getDetailedPermissionStatus(): {
  accessibility: {
    granted: boolean;
    required: boolean;
    description: string;
    systemPreferencesPath: string;
  };
  screenRecording: {
    granted: boolean;
    required: boolean;
    description: string;
    systemPreferencesPath: string;
  };
  allGranted: boolean;
  platform: string;
} {
  const accessibilityGranted = checkAccessibilityPermission();
  const screenRecordingGranted = checkScreenRecordingPermission();

  return {
    accessibility: {
      granted: accessibilityGranted,
      required: isMacOS,
      description: "Required to track active applications and window information",
      systemPreferencesPath: "System Settings > Privacy & Security > Accessibility",
    },
    screenRecording: {
      granted: screenRecordingGranted,
      required: isMacOS,
      description: "Required to access browser URLs and window content for detailed tracking",
      systemPreferencesPath: "System Settings > Privacy & Security > Screen Recording",
    },
    allGranted: accessibilityGranted && screenRecordingGranted,
    platform: process.platform,
  };
}

/**
 * Get verified permission status - actually tests if permissions work
 * This is more reliable than getDetailedPermissionStatus() but is async
 */
export async function getVerifiedPermissionStatus(): Promise<{
  accessibility: {
    granted: boolean;
    required: boolean;
    description: string;
    systemPreferencesPath: string;
  };
  screenRecording: {
    granted: boolean;
    verified: boolean;
    required: boolean;
    description: string;
    systemPreferencesPath: string;
  };
  allGranted: boolean;
  platform: string;
}> {
  const accessibilityGranted = checkAccessibilityPermission();
  const screenRecordingGranted = checkScreenRecordingPermission();
  const screenRecordingVerified = await verifyScreenRecordingPermission();

  return {
    accessibility: {
      granted: accessibilityGranted,
      required: isMacOS,
      description: "Required to track active applications and window information",
      systemPreferencesPath: "System Settings > Privacy & Security > Accessibility",
    },
    screenRecording: {
      granted: screenRecordingGranted,
      verified: screenRecordingVerified,
      required: isMacOS,
      description: "Required to access browser URLs and window content for detailed tracking",
      systemPreferencesPath: "System Settings > Privacy & Security > Screen Recording",
    },
    allGranted: accessibilityGranted && screenRecordingVerified,
    platform: process.platform,
  };
}

export async function updateUserSettings(settings: {
  isWarningPopupEnable?: boolean;
  isClockVisible?: boolean;
  isTimeExceededNotificationEnabled?: boolean;
}) {
  const { isWarningPopupEnable, isClockVisible, isTimeExceededNotificationEnabled } = settings;

  if (isWarningPopupEnable !== undefined) {
    await setValue(USER_SETTINGS_KEYS.isWarningPopupEnable, isWarningPopupEnable.toString());
  }

  if (isClockVisible !== undefined) {
    await setValue(USER_SETTINGS_KEYS.isClockVisible, isClockVisible.toString());
  }

  if (isTimeExceededNotificationEnabled !== undefined) {
    await setValue(
      USER_SETTINGS_KEYS.isTimeExceededNotificationEnabled,
      isTimeExceededNotificationEnabled.toString()
    );
  }
}

export async function isClockVisibilityEnabled(): Promise<boolean> {
  const setting = await getValue(USER_SETTINGS_KEYS.isClockVisible);
  return setting !== "false"; // Default to true if not set
}

async function isTimeExceededNotificationEnabled(): Promise<boolean> {
  const setting = await getValue(USER_SETTINGS_KEYS.isTimeExceededNotificationEnabled);
  return setting !== "false"; // Default to true if not set
}

const getUserBlockedApps = async (userId: string) => {
  const result = await db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
  return result;
};

const getUserBlockedDomains = async (userId: string) => {
  const result = await db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
  return result;
};

/**
 * Get user preferences with defaults
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const stored = await getValue(USER_SETTINGS_KEYS.userPreferences);
    if (!stored) {
      return DEFAULT_USER_PREFERENCES;
    }

    const preferences = JSON.parse(stored) as UserPreferences;

    // Merge with defaults to ensure all fields exist (for version upgrades)
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...preferences,
      sidebar: { ...DEFAULT_USER_PREFERENCES.sidebar, ...preferences.sidebar },
      appearance: { ...DEFAULT_USER_PREFERENCES.appearance, ...preferences.appearance },
      notifications: { ...DEFAULT_USER_PREFERENCES.notifications, ...preferences.notifications },
      focus: { ...DEFAULT_USER_PREFERENCES.focus, ...preferences.focus },
    };
  } catch (error) {
    logger.error("[getUserPreferences] Error loading preferences", { error });
    return DEFAULT_USER_PREFERENCES;
  }
}

/**
 * Update user preferences (partial update supported)
 */
export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const current = await getUserPreferences();

    const updated: UserPreferences = {
      ...current,
      ...updates,
      sidebar: { ...current.sidebar, ...updates.sidebar },
      appearance: { ...current.appearance, ...updates.appearance },
      notifications: { ...current.notifications, ...updates.notifications },
      focus: { ...current.focus, ...updates.focus },
      lastUpdated: Date.now(),
      version: 1,
    };

    await setValue(USER_SETTINGS_KEYS.userPreferences, JSON.stringify(updated));
    logger.info("[updateUserPreferences] Preferences updated", { updates });

    return updated;
  } catch (error) {
    logger.error("[updateUserPreferences] Error updating preferences", { error, updates });
    throw error;
  }
}

/**
 * Reset preferences to defaults
 */
export async function resetUserPreferences(): Promise<UserPreferences> {
  try {
    await setValue(USER_SETTINGS_KEYS.userPreferences, JSON.stringify(DEFAULT_USER_PREFERENCES));
    logger.info("[resetUserPreferences] Preferences reset to defaults");
    return DEFAULT_USER_PREFERENCES;
  } catch (error) {
    logger.error("[resetUserPreferences] Error resetting preferences", { error });
    throw error;
  }
}

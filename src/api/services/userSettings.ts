import db from "../db";
import { blockedDomains, blockedApps } from "../db/schema";
import { eq } from "drizzle-orm";
import { shell, systemPreferences } from "electron";
import { getValue, setValue } from "./localStorage";
import { logger } from "../../helpers/logger";
import { boards } from "../db/schema";
import { createBoard, createColumn, createItem } from "../services/board";
import { nanoid } from "nanoid";

const USER_SETTINGS_KEYS = {
  isWarningPopupEnable: "user.isWarningPopupEnable",
  isClockVisible: "user.isClockVisible",
  isTimeExceededNotificationEnabled: "user.isTimeExceededNotificationEnabled",
  lastUpdateActivity: "user.lastUpdateActivity",
  currentUserId: "user.currentUserId",
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
 * Get detailed permission status with explanations
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

export async function isTimeExceededNotificationEnabled(): Promise<boolean> {
  const setting = await getValue(USER_SETTINGS_KEYS.isTimeExceededNotificationEnabled);
  return setting !== "false"; // Default to true if not set
}

export const getUserBlockedApps = async (userId: string) => {
  const result = await db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
  return result;
};

export const getUserBlockedDomains = async (userId: string) => {
  const result = await db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
  return result;
};

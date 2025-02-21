import db from "..";
import { blockedDomains, blockedApps } from "../schema";
import { eq } from "drizzle-orm";
import { defaultBlockedApps, defaultBlockedDomains } from "../../../config/tracking";
import { getValue, setValue, setMultipleValues } from "./localStorage";
import { logger } from "../../../helpers/logger";

const USER_SETTINGS_KEYS = {
  accessibilityPermission: "user.accessibilityPermission",
  screenRecordingPermission: "user.screenRecordingPermission",
  isFocusMode: "user.isFocusMode",
  currentTaskId: "user.currentTaskId",
  lastUpdateActivity: "user.lastUpdateActivity",
  currentUserId: "user.currentUserId",
  isTracking: "user.isTracking",
};

export async function getUserSettings({ userId }: { userId: string }) {
  const [
    accessibilityPermission,
    screenRecordingPermission,
    isFocusMode,
    currentTaskId,
    lastUpdateActivity,
    isTracking,
  ] = await Promise.all([
    getValue(USER_SETTINGS_KEYS.accessibilityPermission),
    getValue(USER_SETTINGS_KEYS.screenRecordingPermission),
    getValue(USER_SETTINGS_KEYS.isFocusMode),
    getValue(USER_SETTINGS_KEYS.currentTaskId),
    getValue(USER_SETTINGS_KEYS.lastUpdateActivity),
    getValue(USER_SETTINGS_KEYS.isTracking),
  ]);

  return {
    userId,
    accessibilityPermission: accessibilityPermission === "true",
    screenRecordingPermission: screenRecordingPermission === "true",
    isFocusMode: isFocusMode === "true",
    currentTaskId: currentTaskId || null,
    lastUpdateActivity: lastUpdateActivity ? parseInt(lastUpdateActivity) : null,
    isTracking: isTracking === "true",
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
  if (existingUserId && existingUserId !== userId) {
    logger.fatal("[setCurrentUserId] Current user id mismatch", {
      existingUserId,
      userId,
    });
  }

  await setValue(USER_SETTINGS_KEYS.currentUserId, userId);

  existingUserId = userId;

  const defaultSettings = {
    [USER_SETTINGS_KEYS.accessibilityPermission]: "false",
    [USER_SETTINGS_KEYS.screenRecordingPermission]: "false",
    [USER_SETTINGS_KEYS.isFocusMode]: "true",
    [USER_SETTINGS_KEYS.isTracking]: "true",
  };

  await setMultipleValues(defaultSettings);

  // Insert default blocked domains
  for (const domain of defaultBlockedDomains) {
    await db
      .insert(blockedDomains)
      .values({
        userId: existingUserId,
        domain,
        active: true,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [blockedDomains.userId, blockedDomains.domain],
        set: {
          active: true,
          updatedAt: Date.now(),
        },
      });
  }

  // Insert default blocked apps
  for (const appName of defaultBlockedApps) {
    await db
      .insert(blockedApps)
      .values({
        userId: existingUserId,
        appName,
        active: true,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [blockedApps.userId, blockedApps.appName],
        set: {
          active: true,
          updatedAt: Date.now(),
        },
      });
  }
  return existingUserId;
}

export async function updateUserSettings(settings: {
  accessibilityPermission?: boolean;
  screenRecordingPermission?: boolean;
  isFocusMode?: boolean;
  currentTaskId?: string | null;
  lastUpdateActivity?: number | null;
  isTracking?: boolean;
}) {
  const updates: Record<string, string> = {};

  if (settings.accessibilityPermission !== undefined) {
    updates[USER_SETTINGS_KEYS.accessibilityPermission] =
      settings.accessibilityPermission.toString();
  }
  if (settings.screenRecordingPermission !== undefined) {
    updates[USER_SETTINGS_KEYS.screenRecordingPermission] =
      settings.screenRecordingPermission.toString();
  }
  if (settings.isFocusMode !== undefined) {
    updates[USER_SETTINGS_KEYS.isFocusMode] = settings.isFocusMode.toString();
  }
  if (settings.currentTaskId !== undefined) {
    updates[USER_SETTINGS_KEYS.currentTaskId] = settings.currentTaskId || "";
  }
  if (settings.lastUpdateActivity !== undefined) {
    updates[USER_SETTINGS_KEYS.lastUpdateActivity] = settings.lastUpdateActivity?.toString() || "";
  }
  if (settings.isTracking !== undefined) {
    updates[USER_SETTINGS_KEYS.isTracking] = settings.isTracking.toString();
  }
  if (Object.keys(updates).length > 0) {
    await setMultipleValues(updates);
  }
}

export const getUserBlockedApps = async (userId: string) => {
  const result = await db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
  return result;
};

export const getUserBlockedDomains = async (userId: string) => {
  const result = await db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
  return result;
};

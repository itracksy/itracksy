import db from "..";
import { blockedDomains, blockedApps } from "../schema";
import { eq } from "drizzle-orm";
import { defaultBlockedApps, defaultBlockedDomains } from "../../config/tracking";
import { getValue, setValue, setMultipleValues } from "./localStorage";
import { logger } from "../../helpers/logger";

const USER_SETTINGS_KEYS = {
  accessibilityPermission: "user.accessibilityPermission",
  screenRecordingPermission: "user.screenRecordingPermission",
  isFocusMode: "user.isFocusMode",
  currentTaskId: "user.currentTaskId",
  lastUpdateActivity: "user.lastUpdateActivity",
  currentUserId: "user.currentUserId",
};

export async function getUserSettings(userId: string) {
  const [
    accessibilityPermission,
    screenRecordingPermission,
    isFocusMode,
    currentTaskId,
    lastUpdateActivity,
  ] = await Promise.all([
    getValue(USER_SETTINGS_KEYS.accessibilityPermission),
    getValue(USER_SETTINGS_KEYS.screenRecordingPermission),
    getValue(USER_SETTINGS_KEYS.isFocusMode),
    getValue(USER_SETTINGS_KEYS.currentTaskId),
    getValue(USER_SETTINGS_KEYS.lastUpdateActivity),
  ]);

  return {
    userId,
    accessibilityPermission: accessibilityPermission === "true",
    screenRecordingPermission: screenRecordingPermission === "true",
    isFocusMode: isFocusMode === "true",
    currentTaskId: currentTaskId || null,
    lastUpdateActivity: lastUpdateActivity ? parseInt(lastUpdateActivity) : null,
    updatedAt: Date.now(),
  };
}

let existingUserId: string | null = null;
export const getCurrentUserId = () => {
  if (!existingUserId) {
    throw new Error("[getCurrentUserId] User not logged in");
  }
  return existingUserId;
};
export async function setCurrentUserId(supabaseUserId: string): Promise<string> {
  if (existingUserId) {
    if (supabaseUserId && existingUserId !== supabaseUserId) {
      logger.error("[setCurrentUserId] Current user id mismatch", {
        existingUserId,
        supabaseUserId,
      });
    }
    return existingUserId;
  }
  existingUserId = await getValue(USER_SETTINGS_KEYS.currentUserId);

  if (!existingUserId) {
    existingUserId = supabaseUserId;
    await setValue(USER_SETTINGS_KEYS.currentUserId, existingUserId);
    const defaultSettings = {
      [USER_SETTINGS_KEYS.accessibilityPermission]: "false",
      [USER_SETTINGS_KEYS.screenRecordingPermission]: "false",
      [USER_SETTINGS_KEYS.isFocusMode]: "true",
      [USER_SETTINGS_KEYS.lastUpdateActivity]: Date.now().toString(),
    };

    await setMultipleValues(defaultSettings);

    // Insert default blocked domains
    for (const domain of defaultBlockedDomains) {
      await db.insert(blockedDomains).values({
        userId: existingUserId,
        domain,
        updatedAt: Date.now(),
      });
    }

    // Insert default blocked apps
    for (const appName of defaultBlockedApps) {
      await db.insert(blockedApps).values({
        userId: existingUserId,
        appName,
        updatedAt: Date.now(),
      });
    }
    return existingUserId;
  }
  return existingUserId;
}

export async function updateUserSettings(
  userId: string,
  settings: {
    accessibilityPermission?: boolean;
    screenRecordingPermission?: boolean;
    isFocusMode?: boolean;
    currentTaskId?: string | null;
    lastUpdateActivity?: number | null;
  }
) {
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

  if (Object.keys(updates).length > 0) {
    await setMultipleValues(updates);
  }
}

// Blocked Domains functions
export async function getBlockedDomains(userId: string) {
  return db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
}

export async function addBlockedDomain(userId: string, domain: string) {
  await db.insert(blockedDomains).values({
    userId,
    domain,
    updatedAt: Date.now(),
  });
}

export async function removeBlockedDomain(userId: string, domain: string) {
  await db.delete(blockedDomains).where(eq(blockedDomains.domain, domain));
}

// Blocked Apps functions
export async function getBlockedApps(userId: string) {
  return db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
}

export async function addBlockedApp(userId: string, appName: string) {
  await db.insert(blockedApps).values({
    userId,
    appName,
    updatedAt: Date.now(),
  });
}

export async function removeBlockedApp(userId: string, appName: string) {
  await db.delete(blockedApps).where(eq(blockedApps.appName, appName));
}

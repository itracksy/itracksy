import db from "..";
import { userSettings, blockedDomains, blockedApps } from "../schema";
import { eq, and } from "drizzle-orm";
import { defaultBlockedApps, defaultBlockedDomains } from "../../config/tracking";

export async function getUserSettings(userId: string) {
  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .get();

  if (!settings) {
    return createDefaultUserSettings(userId);
  }

  return settings;
}

export async function createDefaultUserSettings(userId: string) {
  const defaultSettings = {
    userId,
    accessibilityPermission: false,
    screenRecordingPermission: false,
    isFocusMode: true,
    updatedAt: Date.now(),
  };

  await db.insert(userSettings).values(defaultSettings);

  // Insert default blocked domains
  const blockedDomainsValues = defaultBlockedDomains.map((domain) => ({
    userId,
    domain,
    updatedAt: Date.now(),
  }));
  await db.insert(blockedDomains).values(blockedDomainsValues);

  // Insert default blocked apps
  const blockedAppsValues = defaultBlockedApps.map((appName) => ({
    userId,
    appName,
    updatedAt: Date.now(),
  }));
  await db.insert(blockedApps).values(blockedAppsValues);

  return defaultSettings;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<typeof userSettings.$inferSelect>
) {
  await db
    .update(userSettings)
    .set({ ...settings, updatedAt: Date.now() })
    .where(eq(userSettings.userId, userId));
}

// Blocked Domains functions
export async function getBlockedDomains(userId: string) {
  return db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
}

export async function addBlockedDomain(userId: string, domain: string) {
  await db
    .insert(blockedDomains)
    .values({
      userId,
      domain,
      updatedAt: Date.now(),
    })
    .onConflictDoNothing();
}

export async function removeBlockedDomain(userId: string, domain: string) {
  await db
    .delete(blockedDomains)
    .where(and(eq(blockedDomains.userId, userId), eq(blockedDomains.domain, domain)));
}

// Blocked Apps functions
export async function getBlockedApps(userId: string) {
  return db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
}

export async function addBlockedApp(userId: string, appName: string) {
  await db
    .insert(blockedApps)
    .values({
      userId,
      appName,
      updatedAt: Date.now(),
    })
    .onConflictDoNothing();
}

export async function removeBlockedApp(userId: string, appName: string) {
  await db
    .delete(blockedApps)
    .where(and(eq(blockedApps.userId, userId), eq(blockedApps.appName, appName)));
}

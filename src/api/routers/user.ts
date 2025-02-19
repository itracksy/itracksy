import { z } from "zod";
import { t } from "../trpc";
import { blockedDomains, blockedApps } from "../db/schema";
import { eq } from "drizzle-orm";
import db from "../db";
import {
  getCurrentUserId,
  setCurrentUserId,
  getUserSettings,
  updateUserSettings,
} from "../db/repositories/userSettings";

const trackingSettingsSchema = z.object({
  accessibilityPermission: z.boolean(),
  screenRecordingPermission: z.boolean(),

  isFocusMode: z.boolean(),
  currentTaskId: z.string().optional(),
});

const updateTrackingSettingsSchema = trackingSettingsSchema.partial();

// Create the router
export const userRouter = t.router({
  getActivitySettings: t.procedure.query(async () => {
    return getUserSettings();
  }),
  updateActivitySettings: t.procedure
    .input(updateTrackingSettingsSchema)
    .mutation(async ({ input }) => {
      return updateUserSettings(input);
    }),
  setCurrrentUserId: t.procedure.input(z.string()).mutation(async ({ input }) => {
    try {
      setCurrentUserId(input);
    } catch (error) {
      throw new Error("Failed to set current user id");
    }
  }),
  // Settings Management
  getBlockedDomains: t.procedure.query(async () => {
    try {
      return db.select().from(blockedDomains).where(eq(blockedDomains.userId, getCurrentUserId()));
    } catch (error) {
      throw new Error("Failed to get blocked domains");
    }
  }),

  addBlockedDomain: t.procedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      await db
        .insert(blockedDomains)
        .values({
          userId: getCurrentUserId(),
          domain: input,
          updatedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: blockedDomains.domain,
          set: {
            updatedAt: Date.now(),
          },
        });
      return { success: true };
    } catch (error) {
      throw new Error("Failed to add blocked domain");
    }
  }),

  removeBlockedDomain: t.procedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      await db.delete(blockedDomains).where(eq(blockedDomains.domain, input));
      return { success: true };
    } catch (error) {
      throw new Error("Failed to remove blocked domain");
    }
  }),

  getBlockedApps: t.procedure.query(async ({ ctx }) => {
    try {
      return db.select().from(blockedApps).where(eq(blockedApps.userId, getCurrentUserId()));
    } catch (error) {
      throw new Error("Failed to get blocked apps");
    }
  }),

  addBlockedApp: t.procedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      await db
        .insert(blockedApps)
        .values({
          userId: getCurrentUserId(),
          appName: input,
          updatedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: blockedApps.appName,
          set: {
            updatedAt: Date.now(),
          },
        });
      return { success: true };
    } catch (error) {
      throw new Error("Failed to add blocked app");
    }
  }),

  removeBlockedApp: t.procedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      await db.delete(blockedApps).where(eq(blockedApps.appName, input));
      return { success: true };
    } catch (error) {
      throw new Error("Failed to remove blocked app");
    }
  }),
});

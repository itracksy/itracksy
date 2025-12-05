import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { blockedDomains, blockedApps } from "../db/schema";
import { and, eq } from "drizzle-orm";
import db from "../db";
import {
  getPermissions,
  getUserSettings,
  setPermissions,
  updateUserSettings,
  getDetailedPermissionStatus,
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
} from "../services/userSettings";

const trackingSettingsSchema = z.object({
  isWarningPopupEnable: z.boolean(),
  isClockVisible: z.boolean(),
  isTimeExceededNotificationEnabled: z.boolean(),
});

const updateTrackingSettingsSchema = trackingSettingsSchema.partial();

// Create the router
export const userRouter = t.router({
  getActivitySettings: protectedProcedure.query(async ({ ctx }) => {
    return getUserSettings({ userId: ctx.userId });
  }),

  updateActivitySettings: protectedProcedure
    .input(updateTrackingSettingsSchema)
    .mutation(async ({ input }) => {
      return updateUserSettings(input);
    }),
  getPermissions: protectedProcedure.query(async ({ ctx }) => {
    return getPermissions();
  }),
  getDetailedPermissionStatus: protectedProcedure.query(async ({ ctx }) => {
    return getDetailedPermissionStatus();
  }),
  setPermissions: protectedProcedure
    .input(
      z.object({
        accessibilityPermission: z.boolean().optional(),
        screenRecordingPermission: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Update permissions
      await setPermissions({
        accessibilityPermission: input.accessibilityPermission ?? false,
        screenRecordingPermission: input.screenRecordingPermission ?? false,
      });
      return { success: true };
    }),

  getCurrrentUserId: protectedProcedure.query(async ({ ctx }) => {
    return ctx.userId;
  }),

  // Settings Management
  getBlockedDomains: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(blockedDomains).where(eq(blockedDomains.userId, ctx.userId));
  }),

  addBlockedDomain: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await db
      .insert(blockedDomains)
      .values({
        userId: ctx.userId,
        domain: input,
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
    return { success: true };
  }),

  removeBlockedDomain: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await db
      .delete(blockedDomains)
      .where(and(eq(blockedDomains.domain, input), eq(blockedDomains.userId, ctx.userId)));
    return { success: true };
  }),

  getBlockedApps: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(blockedApps).where(eq(blockedApps.userId, ctx.userId));
  }),

  addBlockedApp: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await db
      .insert(blockedApps)
      .values({
        userId: ctx.userId,
        appName: input,
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
    return { success: true };
  }),

  removeBlockedApp: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    await db
      .delete(blockedApps)
      .where(and(eq(blockedApps.appName, input), eq(blockedApps.userId, ctx.userId)));

    return { success: true };
  }),

  // User Preferences Management
  getPreferences: protectedProcedure.query(async () => {
    return getUserPreferences();
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        sidebar: z
          .object({
            visibleItems: z
              .array(
                z.enum([
                  "focus-session",
                  "scheduling",
                  "projects",
                  "categorization",
                  "classify",
                  "analytics",
                  "focus-music",
                  "reports",
                  "logs",
                  "settings",
                ])
              )
              .optional(),
            collapsed: z.boolean().optional(),
            pinnedItems: z
              .array(
                z.enum([
                  "focus-session",
                  "scheduling",
                  "projects",
                  "categorization",
                  "classify",
                  "analytics",
                  "focus-music",
                  "reports",
                  "logs",
                  "settings",
                ])
              )
              .optional(),
          })
          .optional(),
        appearance: z
          .object({
            themeMode: z.enum(["light", "dark"]).optional(),
            themeVariant: z
              .enum(["default", "professional", "comfort", "vibrant", "minimal", "nature"])
              .optional(),
            fontScale: z.enum(["small", "normal", "large", "x-large"]).optional(),
            fontFamily: z.enum(["default", "sans", "mono", "dyslexic"]).optional(),
            uiSize: z.enum(["compact", "comfortable", "spacious"]).optional(),
            showAnimations: z.enum(["none", "reduced", "normal", "enhanced"]).optional(),
            reducedMotion: z.boolean().optional(),
            compactMode: z.boolean().optional(),
            showIcons: z.boolean().optional(),
            roundedCorners: z.boolean().optional(),
          })
          .optional(),
        notifications: z
          .object({
            soundEnabled: z.boolean().optional(),
            soundVolume: z.number().min(0).max(100).optional(),
            showDesktopNotifications: z.boolean().optional(),
            showInAppNotifications: z.boolean().optional(),
            focusReminders: z.boolean().optional(),
            breakReminders: z.boolean().optional(),
            goalAchievements: z.boolean().optional(),
          })
          .optional(),
        focus: z
          .object({
            defaultFocusDuration: z.number().min(1).max(240).optional(),
            defaultBreakDuration: z.number().min(1).max(60).optional(),
            autoStartBreaks: z.boolean().optional(),
            autoStartNextSession: z.boolean().optional(),
            dimInactiveWindows: z.boolean().optional(),
            hideDistractions: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateUserPreferences(input as any);
    }),

  resetPreferences: protectedProcedure.mutation(async () => {
    return resetUserPreferences();
  }),
});

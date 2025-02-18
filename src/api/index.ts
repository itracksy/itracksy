import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type {
  ApplicationDurationReport,
  DomainDurationReport,
  CategoryDurationReport,
} from "../types/activity";
import { clearActivities, getActivities } from "../services/ActivityStorage";
import { startTracking, updateActivitySettings, stopTracking } from "./activity";

const t = initTRPC.create();

const trackingSettingsSchema = z.object({
  accessibilityPermission: z.boolean(),
  screenRecordingPermission: z.boolean(),
  blockedDomains: z.array(z.string()),
  blockedApps: z.array(z.string()),
  isFocusMode: z.boolean(),
  taskId: z.string().optional(),
});

const updateTrackingSettingsSchema = trackingSettingsSchema.partial();

const dateRangeSchema = z.object({
  startDate: z.number(),
  endDate: z.number(),
});

// Create the router
export const router = t.router({
  hello: t.procedure.input(z.string().optional()).query(({ input }) => {
    return `Hello ${input ?? "World"}!`;
  }),
  getActivities: t.procedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),
  clearActivities: t.procedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),
  // Activity Tracking Controls
  startTracking: t.procedure.input(trackingSettingsSchema).mutation(async ({ input }) => {
    try {
      // Here we'll implement the actual tracking logic
      startTracking(input);
      return { success: true, settings: input };
    } catch (error) {
      throw new Error("Failed to start tracking");
    }
  }),
  updateActivitySettings: t.procedure.input(updateTrackingSettingsSchema).mutation(async ({ input }) => {
    try {
      updateActivitySettings(input);
      return { success: true, settings: input };
    } catch (error) {
      throw new Error("Failed to update activity settings");
    }
  }),
  stopTracking: t.procedure.mutation(async () => {
    try {
      // Implement stop tracking logic
      stopTracking();
      return { success: true };
    } catch (error) {
      throw new Error("Failed to stop tracking");
    }
  }),

  // Reports and Analytics
  getApplicationReport: t.procedure.input(dateRangeSchema).query(async ({ input }) => {
    try {
      // Implement application duration report generation
      const report: ApplicationDurationReport[] = [];
      return report;
    } catch (error) {
      throw new Error("Failed to generate application report");
    }
  }),

  getDomainReport: t.procedure.input(dateRangeSchema).query(async ({ input }) => {
    try {
      // Implement domain duration report generation
      const report: DomainDurationReport[] = [];
      return report;
    } catch (error) {
      throw new Error("Failed to generate domain report");
    }
  }),

  getCategoryReport: t.procedure.input(dateRangeSchema).query(async ({ input }) => {
    try {
      // Implement category report generation
      const report: CategoryDurationReport[] = [];
      return report;
    } catch (error) {
      throw new Error("Failed to generate category report");
    }
  }),

  // Settings Management
  updateBlockedDomains: t.procedure.input(z.array(z.string())).mutation(async ({ input }) => {
    try {
      // Implement blocked domains update logic
      return { success: true, blockedDomains: input };
    } catch (error) {
      throw new Error("Failed to update blocked domains");
    }
  }),

  updateBlockedApps: t.procedure.input(z.array(z.string())).mutation(async ({ input }) => {
    try {
      // Implement blocked apps update logic
      return { success: true, blockedApps: input };
    } catch (error) {
      throw new Error("Failed to update blocked apps");
    }
  }),

  // System Info
  getSystemInfo: t.procedure.query(() => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      timestamp: new Date().toISOString(),
    };
  }),
});

// Export type router type signature
export type AppRouter = typeof router;

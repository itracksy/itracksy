import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type {
  ActivityRecord,
  ApplicationDurationReport,
  DomainDurationReport,
  CategoryDurationReport,
} from "../types/activity";
import { getActivities } from "../services/ActivityStorage";

const t = initTRPC.create();

// Input validation schemas
const activityRecordSchema = z.object({
  platform: z.string(),
  id: z.number(),
  title: z.string(),
  ownerPath: z.string(),
  ownerProcessId: z.number(),
  ownerBundleId: z.string().optional(),
  ownerName: z.string(),
  url: z.string().optional(),
  timestamp: z.number(),
  count: z.number(),
  userId: z.string().optional(),
});

const trackingSettingsSchema = z.object({
  accessibilityPermission: z.boolean(),
  screenRecordingPermission: z.boolean(),
  blockedDomains: z.array(z.string()),
  blockedApps: z.array(z.string()),
  isFocusMode: z.boolean(),
});

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
  // Activity Tracking Controls
  startTracking: t.procedure.input(trackingSettingsSchema).mutation(async ({ input }) => {
    try {
      // Here we'll implement the actual tracking logic
      return { success: true, settings: input };
    } catch (error) {
      throw new Error("Failed to start tracking");
    }
  }),

  stopTracking: t.procedure.mutation(async () => {
    try {
      // Implement stop tracking logic
      return { success: true };
    } catch (error) {
      throw new Error("Failed to stop tracking");
    }
  }),

  // Activity Records
  recordActivity: t.procedure.input(activityRecordSchema).mutation(async ({ input }) => {
    try {
      // Here we'll implement the logic to save the activity record
      return { success: true, record: input };
    } catch (error) {
      throw new Error("Failed to record activity");
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

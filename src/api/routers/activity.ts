import { z } from "zod";
import { t } from "../trpc";
import { clearActivities, getActivities } from "../../db/repositories/activities";
import { startTracking, updateActivitySettings, stopTracking } from "../services/activity";

const trackingSettingsSchema = z.object({
  accessibilityPermission: z.boolean(),
  screenRecordingPermission: z.boolean(),
  blockedDomains: z.array(z.string()),
  blockedApps: z.array(z.string()),
  isFocusMode: z.boolean(),
  currentTaskId: z.string().optional(),
});

const updateTrackingSettingsSchema = trackingSettingsSchema.partial();

export const activityRouter = t.router({
  getActivities: t.procedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: t.procedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),

  startTracking: t.procedure.input(trackingSettingsSchema).mutation(async ({ input }) => {
    try {
      startTracking(input);
      return { success: true, settings: input };
    } catch (error) {
      throw new Error("Failed to start tracking");
    }
  }),

  stopTracking: t.procedure.mutation(async () => {
    try {
      stopTracking();
      return { success: true };
    } catch (error) {
      throw new Error("Failed to stop tracking");
    }
  }),

  updateSettings: t.procedure.input(updateTrackingSettingsSchema).mutation(async ({ input }) => {
    try {
      updateActivitySettings(input);
      return { success: true, settings: input };
    } catch (error) {
      throw new Error("Failed to update tracking settings");
    }
  }),
});

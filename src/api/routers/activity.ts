import { z } from "zod";
import { t } from "../trpc";
import { clearActivities, getActivities } from "../db/repositories/activities";
import { startTracking, stopTracking } from "../services/activity";
import { updateUserSettings } from "../db/repositories/userSettings";

export const activityRouter = t.router({
  getActivities: t.procedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: t.procedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),

  startTracking: t.procedure.mutation(async () => {
    try {
      await startTracking();
      updateUserSettings({ isTracking: true });
      return { success: true };
    } catch (error) {
      throw new Error("Failed to start tracking");
    }
  }),

  stopTracking: t.procedure.mutation(async () => {
    try {
      stopTracking();
      updateUserSettings({ isTracking: false });
      return { success: true };
    } catch (error) {
      throw new Error("Failed to stop tracking");
    }
  }),
});

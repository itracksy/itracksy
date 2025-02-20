import { publicProcedure, t } from "../trpc";
import { clearActivities, getActivities } from "../db/repositories/activities";
import { startTracking, stopTracking } from "../services/activity";
import { updateUserSettings } from "../db/repositories/userSettings";

export const activityRouter = t.router({
  getActivities: publicProcedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: publicProcedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),

  startTracking: publicProcedure.mutation(async () => {
    await startTracking();
    updateUserSettings({ isTracking: true });
    return { success: true };
  }),

  stopTracking: publicProcedure.mutation(async () => {
    stopTracking();
    updateUserSettings({ isTracking: false });
    return { success: true };
  }),
});

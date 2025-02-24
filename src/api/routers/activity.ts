import { protectedProcedure, t } from "../trpc";
import { clearActivities, getActivities } from "../db/repositories/activities";

export const activityRouter = t.router({
  getActivities: protectedProcedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: protectedProcedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),
});

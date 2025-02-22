import { protectedProcedure, t } from "../trpc";
import { clearActivities, getActivities } from "../db/repositories/activities";
import { startTracking, stopTracking } from "../services/activity";
import { updateUserSettings } from "../db/repositories/userSettings";
import { z } from "zod";
import { getFocusedTimeByHour } from "../db/repositories/dashboard";

export const activityRouter = t.router({
  getActivities: protectedProcedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: protectedProcedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),

  startTracking: protectedProcedure.mutation(async ({ ctx }) => {
    await startTracking(ctx.userId);
    updateUserSettings({ isTracking: true });
    return { success: true };
  }),

  stopTracking: protectedProcedure.mutation(async () => {
    stopTracking();
    updateUserSettings({ isTracking: false });
    return { success: true };
  }),

  getFocusedTimeByHour: protectedProcedure
    .input(z.object({ date: z.number() }))
    .query(async ({ input }) => {
      const focusedTime = await getFocusedTimeByHour(input.date);
      return focusedTime;
    }),
});

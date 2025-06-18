import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { getFocusedTimeByHour, reportProjectByDay } from "../services/dashboard";
import { getFocusPerformanceByPeriod, fillMissingDates } from "../services/focusPerformance";

export const dashboardRouter = t.router({
  reportProjectByDay: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate } = input;
      const userId = ctx.userId;
      return reportProjectByDay(startDate, endDate, userId);
    }),
  getFocusedTimeByHour: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const activityData = await getFocusedTimeByHour(input.startDate, input.endDate, ctx.userId);
      return activityData;
    }),
  getFocusPerformanceByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
        period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate, period } = input;
      const userId = ctx.userId;
      const data = await getFocusPerformanceByPeriod(startDate, endDate, userId, period);
      return fillMissingDates(data, startDate, endDate, period);
    }),
});

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
        boardId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate, boardId } = input;
      const userId = ctx.userId;
      return reportProjectByDay(startDate, endDate, userId, boardId);
    }),
  getFocusedTimeByHour: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
        boardId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const activityData = await getFocusedTimeByHour(
        input.startDate,
        input.endDate,
        ctx.userId,
        input.boardId
      );
      return activityData;
    }),
  getFocusPerformanceByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.number(),
        endDate: z.number(),
        period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
        boardId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { startDate, endDate, period, boardId } = input;
      const userId = ctx.userId;
      const data = await getFocusPerformanceByPeriod(startDate, endDate, userId, period, boardId);
      return fillMissingDates(data, startDate, endDate, period);
    }),
});

import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { getFocusedTimeByHour, reportProjectByDay } from "../db/repositories/dashboard";

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
      const focusedTime = await getFocusedTimeByHour(input.startDate, input.endDate, ctx.userId);
      return focusedTime;
    }),
});

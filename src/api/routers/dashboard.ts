import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { reportProjectByDay } from "../db/repositories/dashboard";

export const dashboardRouter = t.router({
  reportProjectByDay: protectedProcedure
    .input(
      z.object({
        date: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { date } = input;
      const userId = ctx.userId;
      return reportProjectByDay(date, userId);
    }),
});

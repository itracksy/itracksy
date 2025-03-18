import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import {
  createTimeEntry,
  deleteTimeEntry,
  getActiveTimeEntry,
  getTimeEntriesForBoard,
  getTimeEntriesForItem,
  updateTimeEntry,
  getLastTimeEntry,
  getTimeEntries,
  getActivitiesForTimeEntry,
} from "../../api/services/timeEntry";
import { timeEntries } from "../db/schema";
import { createInsertSchema } from "drizzle-zod";
import { getUserActivities } from "../services/activities";
const timeEntryInsertSchema = createInsertSchema(timeEntries);

export const timeEntryRouter = t.router({
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return getActiveTimeEntry(ctx.userId!);
  }),

  getForItem: protectedProcedure.input(z.string()).query(async ({ input }) => {
    return getTimeEntriesForItem(input);
  }),

  getForBoard: protectedProcedure.input(z.string()).query(async ({ input }) => {
    return getTimeEntriesForBoard(input);
  }),

  getLast: protectedProcedure.query(async ({ ctx }) => {
    return getLastTimeEntry(ctx.userId!);
  }),
  getTimeEntries: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        projectId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return getTimeEntries({ ...input, userId: ctx.userId! });
    }),
  getActivitiesForTimeEntry: protectedProcedure.input(z.string()).query(async ({ input }) => {
    return getActivitiesForTimeEntry({ timeEntryId: input });
  }),
  create: protectedProcedure
    .input(timeEntryInsertSchema.omit({ id: true, userId: true }))
    .mutation(async ({ input, ctx }) => {
      return createTimeEntry(input, ctx.userId!);
    }),

  update: protectedProcedure
    .input(timeEntryInsertSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateTimeEntry(id, data);
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return deleteTimeEntry(input);
  }),
});

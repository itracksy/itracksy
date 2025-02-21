import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import {
  createTimeEntry,
  deleteTimeEntry,
  getActiveTimeEntry,
  getTimeEntriesForBoard,
  getTimeEntriesForItem,
  updateTimeEntry,
} from "../../api/services/timeEntry";
import { timeEntries } from "../db/schema";
import { createInsertSchema } from "drizzle-zod";
const timeEntryInsertSchema = createInsertSchema(timeEntries);

export const timeEntryRouter = t.router({
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return getActiveTimeEntry();
  }),

  getForItem: protectedProcedure.input(z.string()).query(async ({ input }) => {
    return getTimeEntriesForItem(input);
  }),

  getForBoard: protectedProcedure.input(z.string()).query(async ({ input }) => {
    return getTimeEntriesForBoard(input);
  }),

  create: protectedProcedure
    .input(timeEntryInsertSchema.omit({ userId: true }))
    .mutation(async ({ ctx, input }) => {
      return createTimeEntry(input, ctx.userId);
    }),

  update: protectedProcedure
    .input(timeEntryInsertSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data } }) => {
      return updateTimeEntry(id, data);
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return deleteTimeEntry(input);
  }),
});

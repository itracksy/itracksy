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

  getLast: protectedProcedure.query(async ({ ctx }) => {
    return getLastTimeEntry(ctx.userId!);
  }),

  create: protectedProcedure
    .input(timeEntryInsertSchema.omit({ id: true, userId: true }))
    .mutation(async ({ input, ctx }) => {
      return createTimeEntry(input, ctx.userId!);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        boardId: z.string().optional(),
        itemId: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateTimeEntry(id, data);
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return deleteTimeEntry(input);
  }),
});

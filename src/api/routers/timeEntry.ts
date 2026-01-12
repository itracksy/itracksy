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
  getTimeEntriesByTimeRange,
  calculateSessionProductivityMetrics,
  getTimeEntriesForExport,
} from "../../api/services/timeEntry";
import { getAIExportData, getAIExportDataCompact } from "../../api/services/aiExport";
import { timeEntries } from "../db/schema";
import { createInsertSchema } from "drizzle-zod";
import { getUserActivities } from "../services/activities";
import { getGroupActivities } from "../services/activityRules";
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
  getTimeEntriesByTimeRange: protectedProcedure
    .input(
      z.object({
        startTimestamp: z.number(),
        endTimestamp: z.number(),
        isFocusMode: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return getTimeEntriesByTimeRange({
        userId: ctx.userId!,
        startTimestamp: input.startTimestamp,
        endTimestamp: input.endTimestamp,
        isFocusMode: input.isFocusMode,
      });
    }),
  getGroupActivitiesForTimeEntry: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const activities = await getActivitiesForTimeEntry({ timeEntryId: input });
    const groupedActivities = await getGroupActivities(activities);
    const productivityMetrics = calculateSessionProductivityMetrics(activities);
    return { groupedActivities, activities, productivityMetrics };
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

  exportCsv: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return getTimeEntriesForExport({
        userId: ctx.userId!,
        startDate,
        endDate,
      });
    }),

  // AI Export endpoints for deep work analysis
  exportForAI: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      return getAIExportData({
        userId: ctx.userId!,
        startDate,
        endDate,
      });
    }),

  exportForAICompact: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      return getAIExportDataCompact({
        userId: ctx.userId!,
        startDate,
        endDate,
      });
    }),

  handleSessionResume: protectedProcedure
    .input(
      z.object({
        action: z.enum(["continue", "dismiss"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { resumeActiveSession, clearPausedSession } = await import("../services/sessionPause");

      if (input.action === "continue") {
        await resumeActiveSession();
        return { success: true, message: "Session resumed" };
      } else {
        // Dismiss session - end it
        const activeEntry = await getActiveTimeEntry(ctx.userId!);
        if (activeEntry && !activeEntry.endTime) {
          await updateTimeEntry(activeEntry.id, { endTime: Date.now() });
        }
        await clearPausedSession();
        return { success: true, message: "Session dismissed" };
      }
    }),

  manualPause: protectedProcedure.mutation(async () => {
    const { manualPauseSession } = await import("../services/sessionPause");
    return manualPauseSession();
  }),

  manualResume: protectedProcedure.mutation(async () => {
    const { manualResumeSession } = await import("../services/sessionPause");
    return manualResumeSession();
  }),

  getPauseState: protectedProcedure.query(async () => {
    const { getPausedSession, isSessionManuallyPaused } = await import("../services/sessionPause");
    const paused = getPausedSession();
    return {
      isPaused: !!paused,
      isManuallyPaused: isSessionManuallyPaused(),
      pausedAt: paused?.pausedAt ?? null,
      timeEntryId: paused?.timeEntryId ?? null,
    };
  }),
});

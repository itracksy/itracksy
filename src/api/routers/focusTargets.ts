import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import {
  getFocusTarget,
  upsertFocusTarget,
  getTodaysFocusProgress,
  shouldSendReminder,
} from "../services/focusTargets";

export const focusTargetsRouter = t.router({
  // Get user's focus target
  getFocusTarget: protectedProcedure.query(async ({ ctx }) => {
    return getFocusTarget(ctx.userId);
  }),

  // Get today's focus progress
  getTodaysProgress: protectedProcedure.query(async ({ ctx }) => {
    return getTodaysFocusProgress(ctx.userId);
  }),

  // Create or update focus target
  upsertFocusTarget: protectedProcedure
    .input(
      z.object({
        targetMinutes: z.number().min(5).max(1440), // 5 minutes to 24 hours
        enableReminders: z.boolean().default(true),
        reminderIntervalMinutes: z.number().min(15).max(480).default(60), // 15 minutes to 8 hours
      })
    )
    .mutation(async ({ input, ctx }) => {
      return upsertFocusTarget(
        ctx.userId,
        input.targetMinutes,
        input.enableReminders,
        input.reminderIntervalMinutes
      );
    }),

  // Check if reminder should be sent
  checkReminder: protectedProcedure.query(async ({ ctx }) => {
    return shouldSendReminder(ctx.userId);
  }),

  // Manually trigger a reminder check (for testing or immediate check)
  triggerReminderCheck: protectedProcedure.mutation(async ({ ctx }) => {
    const { checkAndSendFocusReminder } = await import("../services/focusReminders");
    return checkAndSendFocusReminder(ctx.userId);
  }),
});

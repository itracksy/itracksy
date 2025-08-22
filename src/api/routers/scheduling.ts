import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import {
  createScheduledSession,
  deleteScheduledSession,
  getUserScheduledSessions,
  getScheduledSessionById,
  updateScheduledSession,
  toggleScheduledSessionActive,
  executeScheduledSession,
} from "../services/scheduledSessions";

const createScheduledSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  focusDuration: z.number().min(1).max(180),
  breakDuration: z.number().min(1).max(60),
  cycles: z.number().min(1).max(10),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, "At least one day must be selected"),
  isActive: z.boolean().optional().default(true),
  autoStart: z.boolean().optional().default(false),
});

const updateScheduledSessionSchema = createScheduledSessionSchema.partial().extend({
  id: z.string(),
});

export const schedulingRouter = t.router({
  // Get all scheduled sessions for the current user
  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    return getUserScheduledSessions(ctx.userId);
  }),

  // Get a single scheduled session by ID
  getSessionById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return getScheduledSessionById(input.id, ctx.userId);
    }),

  // Create a new scheduled session
  createSession: protectedProcedure
    .input(createScheduledSessionSchema)
    .mutation(async ({ input, ctx }) => {
      return createScheduledSession(input, ctx.userId);
    }),

  // Update an existing scheduled session
  updateSession: protectedProcedure
    .input(updateScheduledSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      return updateScheduledSession({ id, ...updateData }, ctx.userId);
    }),

  // Delete a scheduled session
  deleteSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const success = await deleteScheduledSession(input.id, ctx.userId);
      return { success };
    }),

  // Toggle active status of a scheduled session
  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return toggleScheduledSessionActive(input.id, ctx.userId, input.isActive);
    }),

  // Manually execute a scheduled session
  executeSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const success = await executeScheduledSession(input.id);
      return { success };
    }),
});

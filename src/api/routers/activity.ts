import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import {
  clearActivities,
  getActivities,
  getProductivityStats,
  getUserActivities,
  setActivityRating,
} from "../services/activities";
import {
  createDefaultRules,
  createRule,
  deleteRule,
  getUserRules,
  toggleRuleActive,
  updateRule,
} from "../services/activityRules";
import { rateUserActivities } from "../services/activityRating";
import { ruleFormSchema } from "../../types/rule";

export const activityRouter = t.router({
  // Existing procedures
  getActivities: protectedProcedure.query(async () => {
    const activities = await getActivities();
    return activities;
  }),

  clearActivities: protectedProcedure.mutation(async () => {
    await clearActivities();
    return { success: true };
  }),

  // New procedures for activity rating
  getUserActivities: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          timeEntryId: z.string().optional(),
          ratingFilter: z.number().optional(), // null = all, 0 = bad, 1 = good, -1 = unrated
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return getUserActivities({
        userId,
        limit: input?.limit,
        offset: input?.offset,
        timeEntryId: input?.timeEntryId,
        ratingFilter: input?.ratingFilter,
      });
    }),

  setActivityRating: protectedProcedure
    .input(
      z.object({
        timestamp: z.number(),
        rating: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return setActivityRating(input.timestamp, userId, input.rating);
    }),

  getProductivityStats: protectedProcedure
    .input(
      z.object({
        startTime: z.number(),
        endTime: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return getProductivityStats(userId, input.startTime, input.endTime);
    }),

  // Activity rule management
  getUserRules: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    return getUserRules(userId);
  }),

  createRule: protectedProcedure.input(ruleFormSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.userId;
    console.log("createRule", input);
    return createRule({
      ...input,
      userId,
    });
  }),

  updateRule: protectedProcedure
    .input(
      ruleFormSchema.merge(
        z.object({
          id: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const userId = ctx.userId;
      return updateRule(id, userId, updates);
    }),

  deleteRule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return deleteRule(input.id, userId);
    }),

  toggleRuleActive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      return toggleRuleActive(input.id, userId, input.active);
    }),

  createDefaultRules: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;
    await createDefaultRules(userId);
    return { success: true };
  }),

  rateUnratedActivities: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;
    const results = await rateUserActivities(userId);
    return {
      success: true,
      count: results.length,
      results,
    };
  }),
});

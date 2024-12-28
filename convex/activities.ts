import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const syncActivities = mutation({
  args: v.object({
    activities: v.array(
      v.object({
        platform: v.string(),
        id: v.number(),
        title: v.string(),
        ownerPath: v.string(),
        ownerProcessId: v.number(),
        ownerBundleId: v.optional(v.string()),
        ownerName: v.string(),
        url: v.optional(v.string()),
        timestamp: v.number(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, { activities }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("not authenticated");

    // Batch insert activities with userId
    await Promise.all(
      activities.map((activity) =>
        ctx.db.insert("windowTracking", {
          ...activity,
          userId,
        })
      )
    );

    return { success: true };
  },
});

export const getActivities = query({
  args: v.object({
    date: v.string(), // ISO date string YYYY-MM-DD
  }),
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("not authenticated");

    // Convert date string to start/end timestamps
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const activities = await ctx.db
      .query("windowTracking")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay.getTime()),
          q.lte(q.field("timestamp"), endOfDay.getTime())
        )
      )
      .order("desc")
      .collect();

    return activities;
  },
});

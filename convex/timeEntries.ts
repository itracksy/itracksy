import { type QueryCtx, internalMutation, mutation, query } from "./_generated/server";
import schema, { type TimeEntry } from "./schema";
import invariant from "tiny-invariant";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Ensure the item exists before creating a time entry
async function ensureItemExists(ctx: QueryCtx, itemId: string): Promise<Doc<"items">> {
  const item = await ctx.db
    .query("items")
    .withIndex("id", (q) => q.eq("id", itemId))
    .unique();

  invariant(item, `missing item: ${itemId}`);
  return item;
}

// Create a new time entry
export const createTimeEntry = mutation({
  args: v.object({
    itemId: v.string(),
    boardId: v.string(),
    start: v.number(),
    id: v.string(),
  }),
  handler: async (ctx, timeEntry) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    await ensureItemExists(ctx, timeEntry.itemId);
    await ctx.db.insert("timeEntries", {
      ...timeEntry,
      userId,
    });
  },
});

// Update an existing time entry
export const updateTimeEntry = mutation({
  args: v.object({
    id: v.string(),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
  }),
  handler: async (ctx, newTimeEntry) => {
    const { id } = newTimeEntry;
    const timeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("id", (q) => q.eq("id", id))
      .unique();
    invariant(timeEntry, `missing time entry: ${id}`);
    await ensureItemExists(ctx, timeEntry.itemId);
    await ctx.db.patch(timeEntry._id, newTimeEntry);
  },
});

// Delete a time entry
export const deleteTimeEntry = mutation({
  args: v.object({
    id: v.string(),
    itemId: v.string(),
  }),
  handler: async (ctx, { id, itemId }) => {
    await ensureItemExists(ctx, itemId);
    const timeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("id", (q) => q.eq("id", id))
      .unique();

    invariant(timeEntry, `missing time entry: ${id}`);
    await ctx.db.delete(timeEntry._id);
  },
});

export const getActiveTimeEntry = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject;

    const timeEntries = await ctx.db
      .query("timeEntries")
      .filter((q) => q.and(q.eq(q.field("userId"), userId), q.eq(q.field("end"), undefined)))
      .first();

    return timeEntries;
  },
});

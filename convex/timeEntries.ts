import { type QueryCtx, mutation, query } from "./_generated/server";
import invariant from "tiny-invariant";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("not authenticated");
    }
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

// Type for the active time entry response
type ActiveTimeEntry = Doc<"timeEntries"> & {
  item: Doc<"items"> | null;
};

export const getActiveTimeEntry = query({
  args: {},
  handler: async (ctx): Promise<ActiveTimeEntry | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("not authenticated");
    }

    const timeEntry = await ctx.db
      .query("timeEntries")
      .filter((q) => q.and(q.eq(q.field("userId"), userId), q.eq(q.field("end"), undefined)))
      .first();

    if (!timeEntry) return null;

    // Get the associated item details
    const item = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("id"), timeEntry.itemId))
      .first();
    console.log("timeEntry", timeEntry);
    console.log("item", item);
    return {
      ...timeEntry,
      item: item,
    };
  },
});

// Get time entries for a specific board
export const getBoardTimeEntries = query({
  args: v.object({
    boardId: v.string(),
  }),
  handler: async (ctx, { boardId }): Promise<ActiveTimeEntry[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("not authenticated");
    }
    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("board", (q) => q.eq("boardId", boardId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get the associated items for each time entry
    const entriesWithItems = await Promise.all(
      timeEntries.map(async (entry) => {
        const item = await ctx.db
          .query("items")
          .withIndex("id", (q) => q.eq("id", entry.itemId))
          .unique();
        return { ...entry, item };
      })
    );

    return entriesWithItems;
  },
});

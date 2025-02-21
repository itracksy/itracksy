import { eq, desc, and, isNull } from "drizzle-orm";
import { timeEntries, items } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";

export type TimeEntry = typeof timeEntries.$inferSelect;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
export type Item = typeof items.$inferSelect;

export async function getActiveTimeEntry() {
  const entry = await db.query.timeEntries.findFirst({
    where: isNull(timeEntries.endTime),
    with: {
      item: true,
    },
  });

  if (!entry) {
    // Clean up any orphaned active entries
    await db.delete(timeEntries).where(isNull(timeEntries.endTime));
    return null;
  }

  return entry;
}

export async function createTimeEntry(
  timeEntry: Omit<TimeEntryInsert, "id" | "userId">,
  userId: string
): Promise<TimeEntry> {
  const newEntry = await db
    .insert(timeEntries)
    .values({
      ...timeEntry,
      id: nanoid(),
      userId,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return newEntry[0];
}

export async function updateTimeEntry(
  id: string,
  timeEntry: Partial<TimeEntryInsert>
): Promise<TimeEntry> {
  const updated = await db
    .update(timeEntries)
    .set(timeEntry)
    .where(eq(timeEntries.id, id))
    .returning();

  return updated[0];
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
}

export async function getTimeEntriesForItem(itemId: string): Promise<TimeEntry[]> {
  return await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.itemId, itemId))
    .orderBy(desc(timeEntries.startTime));
}

export async function getTimeEntriesForBoard(boardId: string) {
  return await db.query.timeEntries.findMany({
    where: eq(timeEntries.boardId, boardId),
    with: {
      item: true,
    },
    orderBy: desc(timeEntries.startTime),
  });
}

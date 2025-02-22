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
  const id = nanoid();
  const entry = {
    ...timeEntry,
    id,
    userId,
    createdAt: new Date().toISOString(),
  };

  // Calculate duration if end time is provided
  if (entry.endTime) {
    const startTime = new Date(entry.startTime).getTime();
    const endTime = new Date(entry.endTime).getTime();
    entry.duration = Math.floor((endTime - startTime) / 1000); // Convert ms to seconds
  }

  const created = await db
    .insert(timeEntries)
    .values(entry)
    .onConflictDoUpdate({
      target: timeEntries.id,
      set: entry,
    })
    .returning();

  return created[0];
}

export async function updateTimeEntry(
  id: string,
  timeEntry: Partial<TimeEntryInsert>
): Promise<TimeEntry> {
  // If endTime is being updated, calculate the duration
  if (timeEntry.endTime) {
    const entry = await db
      .select({
        startTime: timeEntries.startTime,
      })
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .limit(1);

    if (entry[0]) {
      const startTime = new Date(entry[0].startTime).getTime();
      const endTime = new Date(timeEntry.endTime).getTime();
      const duration = Math.floor((endTime - startTime) / 1000); // Convert ms to seconds
      timeEntry.duration = duration;
    }
  }
  
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

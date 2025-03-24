import { eq, desc, and, isNull, isNotNull, sql, gte, lte } from "drizzle-orm";
import { timeEntries, items, activities } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";

export type TimeEntry = typeof timeEntries.$inferSelect;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
export type Item = typeof items.$inferSelect;

export async function getActiveTimeEntry(userId: string) {
  const entry = await db.query.timeEntries.findFirst({
    where: and(isNull(timeEntries.endTime), eq(timeEntries.userId, userId)),
    with: {
      item: true,
    },
  });
  return entry ?? null;
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
    createdAt: Date.now(),
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

export async function getLastTimeEntry(userId: string) {
  const entry = await db.query.timeEntries.findFirst({
    where: and(eq(timeEntries.userId, userId), isNotNull(timeEntries.endTime)),
    orderBy: desc(timeEntries.startTime),
    with: {
      item: true,
    },
  });
  return entry ?? null;
}

export async function getLastWorkingTimeEntry(userId: string) {
  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, userId),
      eq(timeEntries.isFocusMode, true),
      isNotNull(timeEntries.endTime)
    ),
    orderBy: desc(timeEntries.startTime),
    with: {
      item: true,
    },
  });

  return entry ?? null; // Ensure we always return null instead of undefined
}

export async function getTimeEntries({
  userId,
  boardId,
  page = 1,
  limit = 20,
}: {
  userId: string;
  boardId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  entries: TimeEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * limit;
  const whereConditions = [eq(timeEntries.userId, userId)];
  if (boardId) {
    whereConditions.push(eq(timeEntries.boardId, boardId));
  }

  const [entries, total] = await Promise.all([
    db.query.timeEntries.findMany({
      where: and(...whereConditions),
      with: {
        item: true,
      },
      orderBy: desc(timeEntries.startTime),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(timeEntries)
      .where(and(...whereConditions))
      .then((result) => result[0].count),
  ]);

  return {
    entries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTimeEntriesByTimeRange({
  userId,
  startTimestamp,
  endTimestamp,
}: {
  userId: string;
  startTimestamp: number;
  endTimestamp: number;
}): Promise<TimeEntry[]> {
  const startOfDay = new Date(startTimestamp);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endTimestamp);
  endOfDay.setHours(23, 59, 59, 999);
  const whereConditions = [
    eq(timeEntries.userId, userId),
    gte(timeEntries.startTime, startOfDay.getTime()),
    lte(timeEntries.startTime, endOfDay.getTime()),
  ];

  const entries = await db.query.timeEntries.findMany({
    where: and(...whereConditions),
    with: {
      item: true,
    },
    orderBy: desc(timeEntries.startTime),
  });

  return entries;
}

export async function getActivitiesForTimeEntry({ timeEntryId }: { timeEntryId: string }) {
  return await db.query.activities.findMany({
    where: eq(activities.timeEntryId, timeEntryId),
    orderBy: [desc(activities.timestamp), desc(activities.duration)],
  });
}

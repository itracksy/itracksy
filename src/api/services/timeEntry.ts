import { eq, desc, and, isNull, isNotNull, sql, gte, lte } from "drizzle-orm";
import { timeEntries, items, activities, boards, categories } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";
import { TimeEntryWithRelations } from "@/types/projects";
import { sendClockUpdate } from "../../helpers/ipc/clock/clock-listeners";
import { showClockWindow } from "../../main/windows/clock";
import { getTray } from "../../main";
import { isClockVisibilityEnabled } from "./userSettings";

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

  // Show clock window when a new session starts (only if it doesn't have an endTime)
  if (!entry.endTime) {
    try {
      // Check if clock visibility is enabled in settings before showing
      const isClockEnabled = await isClockVisibilityEnabled();
      if (isClockEnabled) {
        showClockWindow();
      }
    } catch (error) {
      console.error("Failed to show clock window:", error);
      // Don't throw error here to avoid breaking the time entry creation
    }
  }

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

  // If endTime is set (session stopped), send update to clock window
  if (timeEntry.endTime) {
    try {
      // Send clock update to notify that the session has stopped
      await sendClockUpdate({
        activeEntry: null, // No active entry since it was stopped
        currentTime: Date.now(),
        action: "stop",
        timestamp: Date.now(),
      });

      // Clear tray title when session stops
      const tray = getTray();
      if (tray) {
        tray.setTitle("");
      }
    } catch (error) {
      console.error("Failed to send clock update:", error);
      // Don't throw error here to avoid breaking the time entry update
    }
  }

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

export async function getLastSessionByMode(userId: string, isFocusMode: boolean) {
  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, userId),
      eq(timeEntries.isFocusMode, isFocusMode),
      isNotNull(timeEntries.endTime)
    ),
    orderBy: desc(timeEntries.startTime),
    with: {
      item: true,
    },
  });

  return entry ?? null;
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
  isFocusMode,
}: {
  userId: string;
  startTimestamp: number;
  endTimestamp: number;
  isFocusMode?: boolean;
}): Promise<TimeEntryWithRelations[]> {
  const startOfDay = new Date(startTimestamp);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endTimestamp);
  endOfDay.setHours(23, 59, 59, 999);
  const whereConditions = [
    eq(timeEntries.userId, userId),
    gte(timeEntries.startTime, startOfDay.getTime()),
    lte(timeEntries.startTime, endOfDay.getTime()),
  ];

  // Add focus mode filter if specified
  if (isFocusMode !== undefined) {
    whereConditions.push(eq(timeEntries.isFocusMode, isFocusMode));
  }

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

export type ClassificationStatus = "unclassified" | "partial" | "complete";

export type SessionProductivityMetrics = {
  classificationStatus: ClassificationStatus;
  totalActivities: number;
  classifiedActivities: number;
  productiveTime: number;
  sessionDuration: number;
  productivityPercentage: number;
};

export function calculateSessionProductivityMetrics(
  activityList: (typeof activities.$inferSelect)[]
): SessionProductivityMetrics {
  // Calculate classification status
  const totalActivities = activityList.length;
  const classifiedActivities = activityList.filter(
    (a: typeof activities.$inferSelect) => a.rating !== null
  ).length;

  let classificationStatus: ClassificationStatus = "unclassified";
  if (classifiedActivities === totalActivities && totalActivities > 0) {
    classificationStatus = "complete";
  } else if (classifiedActivities > 0) {
    classificationStatus = "partial";
  }

  // Calculate productivity for this session
  const productiveTime = activityList
    .filter((activity: typeof activities.$inferSelect) => activity.rating === 1)
    .reduce(
      (total: number, activity: typeof activities.$inferSelect) => total + activity.duration,
      0
    );
  const sessionDuration = activityList.reduce(
    (total: number, activity: typeof activities.$inferSelect) => total + activity.duration,
    0
  );
  const productivityPercentage =
    sessionDuration > 0 ? Math.min(100, Math.round((productiveTime / sessionDuration) * 100)) : 0;

  return {
    classificationStatus,
    totalActivities,
    classifiedActivities,
    productiveTime,
    sessionDuration,
    productivityPercentage,
  };
}

export async function getTimeEntriesForExport({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<any[]> {
  let whereConditions = [eq(timeEntries.userId, userId)];

  // Add date filters if provided
  if (startDate) {
    whereConditions.push(gte(timeEntries.startTime, startDate.getTime()));
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    whereConditions.push(lte(timeEntries.startTime, endOfDay.getTime()));
  }

  const entries = await db
    .select({
      id: timeEntries.id,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      duration: timeEntries.duration,
      description: timeEntries.description,
      isFocusMode: timeEntries.isFocusMode,
      boardId: timeEntries.boardId,
      itemId: timeEntries.itemId,
      boardName: boards.name,
      boardColor: boards.color,
      itemTitle: items.title,
      itemContent: items.content,
    })
    .from(timeEntries)
    .leftJoin(boards, eq(timeEntries.boardId, boards.id))
    .leftJoin(items, eq(timeEntries.itemId, items.id))
    .where(and(...whereConditions))
    .orderBy(desc(timeEntries.startTime));

  // Get activities with categories for each time entry
  const entriesWithActivities = await Promise.all(
    entries.map(async (entry) => {
      const activitiesData = await db
        .select({
          categoryName: categories.name,
          activityTitle: activities.title,
          activityDuration: activities.duration,
          rating: activities.rating,
        })
        .from(activities)
        .leftJoin(categories, eq(activities.categoryId, categories.id))
        .where(eq(activities.timeEntryId, entry.id));

      // Get unique categories used during this time entry
      const categoriesUsed = Array.from(
        new Set(activitiesData.map((a) => a.categoryName).filter(Boolean))
      ).join("; ");

      // Calculate productivity stats
      const totalActivityTime = activitiesData.reduce(
        (sum, a) => sum + (a.activityDuration || 0),
        0
      );
      const productiveTime = activitiesData
        .filter((a) => a.rating === 1)
        .reduce((sum, a) => sum + (a.activityDuration || 0), 0);
      const productivityPercentage =
        totalActivityTime > 0 ? Math.round((productiveTime / totalActivityTime) * 100) : 0;

      return {
        ...entry,
        categoriesUsed,
        productivityPercentage,
      };
    })
  );

  return entriesWithActivities;
}

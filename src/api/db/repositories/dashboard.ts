import db from "..";
import { activities, timeEntries, items, boards } from "../schema";

import { gte, desc, and, eq, sql, lte, isNull, isNotNull } from "drizzle-orm";

export const getFocusedTimeByHour = async (
  startDate: number,
  endDate: number,
  userId: string
): Promise<
  {
    hour: number;
    totalFocusedTime: number;
    activities: {
      title: string;
      ownerName: string;
      duration: number;
    }[];
  }[]
> => {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get timezone offset in minutes
  const timezoneOffset = new Date().getTimezoneOffset();

  // Create reusable hour calculation
  const hourExpr = sql`strftime('%H', datetime(${activities.timestamp} / 1000 + ${-timezoneOffset * 60}, 'unixepoch'))`;
  const hourCast = sql<number>`cast(${hourExpr} as integer)`;

  // First get hourly summaries
  const hourSummaries = await db
    .select({
      hour: hourCast,
      totalFocusedTime: sql<number>`sum(${activities.duration})`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime()),
        eq(activities.userId, userId)
      )
    )
    .groupBy(hourExpr)
    .orderBy(hourCast);

  // Then get detailed activities for each hour
  const detailedActivities = await db
    .select({
      hour: hourCast,
      title: activities.title,
      ownerName: activities.ownerName,
      duration: activities.duration,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime()),

        eq(activities.userId, userId)
      )
    )
    .orderBy(desc(activities.duration))
    .limit(15);

  // Combine the summaries with detailed activities
  return hourSummaries.map((summary) => {
    const hourActivities = detailedActivities
      .filter((activity) => activity.hour === summary.hour)
      .map(({ title, ownerName, duration }) => ({
        title,
        ownerName,
        duration,
      }));

    return {
      hour: summary.hour,
      totalFocusedTime: summary.totalFocusedTime ?? 0,
      activities: hourActivities,
    };
  });
};

export const reportProjectByDay = async (startDate: number, endDate: number, userId: string) => {
  const startDateTime = new Date(startDate);
  startDateTime.setHours(0, 0, 0, 0);

  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 59, 59, 999);

  // Update entries with null duration
  await db
    .update(timeEntries)
    .set({
      duration: sql`CAST(
        (CAST(${timeEntries.endTime} AS INTEGER) - CAST(${timeEntries.startTime} AS INTEGER)) / 1000
        AS INTEGER
      )`,
    })
    .where(and(isNull(timeEntries.duration), isNotNull(timeEntries.startTime)));

  // Get entries grouped by board and item
  const entries = await db
    .select({
      boardId: boards.id,
      boardName: boards.name,
      boardColor: boards.color,
      itemId: items.id,
      itemTitle: items.title,
      totalDuration: sql<number>`COALESCE(sum(${timeEntries.duration}), 0)`,
    })
    .from(timeEntries)
    .leftJoin(boards, eq(timeEntries.boardId, boards.id))
    .leftJoin(items, eq(timeEntries.itemId, items.id))
    .where(
      and(
        gte(timeEntries.startTime, startDateTime.getTime()),
        lte(timeEntries.startTime, endDateTime.getTime()),
        eq(timeEntries.userId, userId),
        isNotNull(timeEntries.boardId),
        isNotNull(timeEntries.itemId)
      )
    )
    .groupBy(boards.id, items.id)
    .orderBy(desc(sql<number>`sum(${timeEntries.duration})`));

  // Calculate total duration for the day
  const totalDuration = entries.reduce((sum, entry) => sum + entry.totalDuration, 0);

  type TaskType = {
    id: string;
    title: string;
    duration: number;
  };

  type BoardType = {
    id: string;
    name: string;
    color: string | null;
    totalDuration: number;
    tasks: TaskType[];
  };

  // Group entries by board
  const boardMap = new Map<string, BoardType>();

  entries.forEach((entry) => {
    if (!entry.boardId || !entry.itemId) return; // Skip entries without board or item

    const board = boardMap.get(entry.boardId) || {
      id: entry.boardId,
      name: entry.boardName || "Untitled Board",
      color: entry.boardColor,
      totalDuration: 0,
      tasks: [],
    };

    board.totalDuration += entry.totalDuration;
    board.tasks.push({
      id: entry.itemId,
      title: entry.itemTitle || "Untitled Task",
      duration: entry.totalDuration,
    });

    boardMap.set(entry.boardId, board);
  });

  // Convert map to array and sort boards by total duration
  const projects = Array.from(boardMap.values())
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .map((board) => ({
      ...board,
      tasks: board.tasks.sort((a, b) => b.duration - a.duration),
    }));

  return {
    startDate: startDateTime.getTime(),
    endDate: endDateTime.getTime(),
    totalDuration,
    projects,
  };
};

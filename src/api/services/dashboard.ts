import db from "../db";
import { activities, timeEntries, items, boards } from "../db/schema";

import { gte, desc, and, eq, sql, lte, isNull, isNotNull } from "drizzle-orm";

export const getFocusedTimeByHour = async (
  startDate: number,
  endDate: number,
  userId: string
): Promise<
  {
    hour: number;
    totalSecondsFocusedTime: number;
    totalSecondsBreakTime: number;
    activities: {
      title: string;
      ownerName: string;
      duration: number;
      isFocusMode: boolean;
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

  // First get hourly summaries for focus mode
  const focusHourSummaries = await db
    .select({
      hour: hourCast,
      totalFocusedTime: sql<number>`sum(${activities.duration})`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime()),
        eq(activities.userId, userId),
        eq(activities.isFocusMode, true)
      )
    )
    .groupBy(hourExpr)
    .orderBy(hourCast);

  // Get hourly summaries for break mode
  const breakHourSummaries = await db
    .select({
      hour: hourCast,
      totalBreakTime: sql<number>`sum(${activities.duration})`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime()),
        eq(activities.userId, userId),
        eq(activities.isFocusMode, false)
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
      isFocusMode: activities.isFocusMode,
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

  // Get all unique hours from both focus and break summaries
  const allHours = new Set([
    ...focusHourSummaries.map((summary) => summary.hour),
    ...breakHourSummaries.map((summary) => summary.hour),
  ]);

  // Create a map for quick lookup
  const focusMap = new Map(focusHourSummaries.map((item) => [item.hour, item.totalFocusedTime]));
  const breakMap = new Map(breakHourSummaries.map((item) => [item.hour, item.totalBreakTime]));

  // Combine the summaries with detailed activities
  return Array.from(allHours)
    .map((hour) => {
      const hourActivities = detailedActivities
        .filter((activity) => activity.hour === hour)
        .map(({ title, ownerName, duration, isFocusMode }) => ({
          title,
          ownerName,
          duration,
          isFocusMode: isFocusMode ?? true, // Default to focus mode if null
        }));

      return {
        hour,
        totalSecondsFocusedTime: focusMap.get(hour) ?? 0,
        totalSecondsBreakTime: breakMap.get(hour) ?? 0,
        activities: hourActivities,
      };
    })
    .sort((a, b) => a.hour - b.hour);
};

export const reportProjectByDay = async (startDate: number, endDate: number, userId: string) => {
  const startDateTime = new Date(startDate);
  startDateTime.setHours(0, 0, 0, 0);

  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 59, 59, 999);

  // Update entries with null duration
  const currentTimeMs = Date.now();
  await db
    .update(timeEntries)
    .set({
      duration: sql`CAST(
        (${Math.floor(currentTimeMs / 1000)} - CAST(${timeEntries.startTime} / 1000 AS INTEGER))
        AS INTEGER
      )`,
    })
    .where(and(isNull(timeEntries.endTime), isNotNull(timeEntries.startTime)));

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

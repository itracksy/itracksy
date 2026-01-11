import db from "../db";
import { activities } from "../db/schema";
import { gte, lte, and, eq, sql } from "drizzle-orm";

export interface DailyActivityData {
  date: string; // YYYY-MM-DD
  focusHours: number;
  activityCount: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 1-4 = intensity levels
}

export interface ActivityHeatmapData {
  days: DailyActivityData[];
  totalFocusHours: number;
  totalActivityCount: number;
  averageDailyHours: number;
  longestStreak: number;
  currentStreak: number;
}

// Calculate intensity level based on focus hours
const calculateLevel = (focusHours: number): 0 | 1 | 2 | 3 | 4 => {
  if (focusHours === 0) return 0;
  if (focusHours < 2) return 1; // Light: 0-2 hours
  if (focusHours < 4) return 2; // Medium: 2-4 hours
  if (focusHours < 6) return 3; // Dark: 4-6 hours
  return 4; // Very dark: 6+ hours
};

// Calculate streaks from daily data
const calculateStreaks = (days: DailyActivityData[]): { longest: number; current: number } => {
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  // Sort by date descending to calculate current streak
  const sortedDays = [...days].sort((a, b) => b.date.localeCompare(a.date));

  // Calculate current streak (consecutive days from today with activity)
  const today = new Date().toISOString().split("T")[0];
  for (const day of sortedDays) {
    if (day.focusHours > 0) {
      const dayDate = new Date(day.date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - currentStreak);

      if (day.date === expectedDate.toISOString().split("T")[0]) {
        currentStreak++;
      } else if (currentStreak === 0) {
        // Allow for today not having activity yet
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (day.date === yesterday.toISOString().split("T")[0]) {
          currentStreak++;
        }
      } else {
        break;
      }
    } else if (currentStreak > 0) {
      break;
    }
  }

  // Calculate longest streak
  const sortedAsc = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sortedAsc) {
    if (day.focusHours > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { longest: longestStreak, current: currentStreak };
};

export const getActivityHeatmapData = async (
  userId: string,
  months: number = 3
): Promise<ActivityHeatmapData> => {
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  // Get timezone offset
  const timezoneOffset = new Date().getTimezoneOffset();

  // Query daily aggregates
  const dateExpr = sql`date(datetime(${activities.timestamp} / 1000 + ${-timezoneOffset * 60}, 'unixepoch'))`;

  const dailyData = await db
    .select({
      date: dateExpr,
      totalSeconds: sql<number>`SUM(CASE WHEN ${activities.isFocusMode} = 1 THEN ${activities.duration} ELSE 0 END)`,
      activityCount: sql<number>`COUNT(*)`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startDate.getTime()),
        lte(activities.timestamp, endDate.getTime()),
        eq(activities.userId, userId)
      )
    )
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  // Create a map of all days in the range
  const daysMap = new Map<string, DailyActivityData>();

  // Initialize all days with zero values
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    daysMap.set(dateStr, {
      date: dateStr,
      focusHours: 0,
      activityCount: 0,
      level: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill in actual data
  for (const row of dailyData) {
    const dateStr = String(row.date);
    const focusHours = Number(row.totalSeconds || 0) / 3600;
    const activityCount = Number(row.activityCount || 0);

    daysMap.set(dateStr, {
      date: dateStr,
      focusHours: Math.round(focusHours * 100) / 100,
      activityCount,
      level: calculateLevel(focusHours),
    });
  }

  // Convert to array and sort by date
  const days = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate totals
  const totalFocusHours = days.reduce((sum, day) => sum + day.focusHours, 0);
  const totalActivityCount = days.reduce((sum, day) => sum + day.activityCount, 0);
  const daysWithActivity = days.filter((d) => d.focusHours > 0).length;
  const averageDailyHours = daysWithActivity > 0 ? totalFocusHours / daysWithActivity : 0;

  // Calculate streaks
  const { longest, current } = calculateStreaks(days);

  return {
    days,
    totalFocusHours: Math.round(totalFocusHours * 100) / 100,
    totalActivityCount,
    averageDailyHours: Math.round(averageDailyHours * 100) / 100,
    longestStreak: longest,
    currentStreak: current,
  };
};

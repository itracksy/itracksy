import db from "../db";
import { activities, timeEntries, items, boards, categories } from "../db/schema";
import { gte, lte, desc, and, eq, sql, isNotNull } from "drizzle-orm";

// ============================================================================
// Types for AI Deep Work Analysis Export
// ============================================================================

interface ContextSwitch {
  timestamp: number;
  fromApp: string;
  fromTitle: string;
  toApp: string;
  toTitle: string;
  durationInNewContext: number; // seconds
  switchType: "macro" | "micro" | "tab" | "interruption";
}

interface FocusStreak {
  startTimestamp: number;
  endTimestamp: number;
  durationSeconds: number;
  appName: string;
  activitiesCount: number;
}

export interface SessionActivity {
  timestamp: number;
  appName: string;
  title: string;
  url: string | null;
  domain: string | null;
  duration: number;
  rating: number | null;
  categoryPath: string | null;
  categoryName: string | null;
}

export interface SessionMetrics {
  id: string;
  startTime: number;
  endTime: number | null;
  isFocusMode: boolean;
  targetDuration: number | null;
  taskName: string | null;
  projectName: string | null;
  projectColor: string | null;
  description: string | null;

  // Computed metrics
  totalDurationSeconds: number;
  totalFocusSeconds: number;
  totalDistractedSeconds: number;
  totalUnratedSeconds: number;
  contextSwitchCount: number;
  longestFocusStreakSeconds: number;
  averageActivityDurationSeconds: number;
  uniqueAppsUsed: number;
  productivityScore: number; // 0-100

  // Detailed data
  activities: SessionActivity[];
  contextSwitches: ContextSwitch[];
  focusStreaks: FocusStreak[];
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTimeSeconds: number;
  totalBreakTimeSeconds: number;
  totalProductiveSeconds: number;
  totalDistractedSeconds: number;
  contextSwitchCount: number;
  deepWorkBlocksCount: number; // sessions > 25min with < 3 switches
  sessionsCount: number;
  focusSessionsCount: number;
  breakSessionsCount: number;
  averageSessionDurationSeconds: number;
  longestSessionSeconds: number;
  productivityScore: number;
  topApps: { app: string; duration: number; rating: number | null }[];
  topCategories: { category: string; duration: number }[];
  peakProductivityHour: number | null;
}

export interface AIExportData {
  exportedAt: number;
  userId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSessions: number;
    totalFocusSessions: number;
    totalBreakSessions: number;
    totalFocusTimeSeconds: number;
    totalBreakTimeSeconds: number;
    totalContextSwitches: number;
    averageProductivityScore: number;
    deepWorkBlocksCount: number;
    longestFocusStreakSeconds: number;
  };
  sessions: SessionMetrics[];
  dailyStats: DailyStats[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract domain from URL
 */
function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Determine context switch type based on app characteristics
 */
function determineSwitch(
  fromApp: string,
  toApp: string,
  durationInNew: number
): "macro" | "micro" | "tab" | "interruption" {
  const communicationApps = [
    "slack",
    "teams",
    "discord",
    "messages",
    "mail",
    "outlook",
    "telegram",
    "whatsapp",
  ];
  const browsers = ["chrome", "firefox", "safari", "edge", "arc", "brave"];

  const fromAppLower = fromApp.toLowerCase();
  const toAppLower = toApp.toLowerCase();

  // Check if switching to a communication app (interruption)
  if (communicationApps.some((app) => toAppLower.includes(app))) {
    return "interruption";
  }

  // Check if both are browsers (tab cycling)
  if (
    browsers.some((b) => fromAppLower.includes(b)) &&
    browsers.some((b) => toAppLower.includes(b))
  ) {
    return "tab";
  }

  // Micro switch if duration < 30 seconds
  if (durationInNew < 30) {
    return "micro";
  }

  return "macro";
}

/**
 * Calculate context switches from a sorted list of activities
 */
function calculateContextSwitches(sortedActivities: SessionActivity[]): ContextSwitch[] {
  const switches: ContextSwitch[] = [];

  for (let i = 1; i < sortedActivities.length; i++) {
    const prev = sortedActivities[i - 1];
    const curr = sortedActivities[i];

    // Only count as switch if app changed
    if (prev.appName !== curr.appName) {
      const switchType = determineSwitch(prev.appName, curr.appName, curr.duration);

      switches.push({
        timestamp: curr.timestamp,
        fromApp: prev.appName,
        fromTitle: prev.title,
        toApp: curr.appName,
        toTitle: curr.title,
        durationInNewContext: curr.duration,
        switchType,
      });
    }
  }

  return switches;
}

/**
 * Calculate focus streaks (continuous time in same app)
 */
function calculateFocusStreaks(sortedActivities: SessionActivity[]): FocusStreak[] {
  if (sortedActivities.length === 0) return [];

  const streaks: FocusStreak[] = [];
  let currentStreak: FocusStreak | null = null;

  for (const activity of sortedActivities) {
    if (!currentStreak || currentStreak.appName !== activity.appName) {
      // Save previous streak if significant (> 5 minutes)
      if (currentStreak && currentStreak.durationSeconds >= 300) {
        streaks.push(currentStreak);
      }

      // Start new streak
      currentStreak = {
        startTimestamp: activity.timestamp,
        endTimestamp: activity.timestamp + activity.duration * 1000,
        durationSeconds: activity.duration,
        appName: activity.appName,
        activitiesCount: 1,
      };
    } else {
      // Continue streak
      currentStreak.endTimestamp = activity.timestamp + activity.duration * 1000;
      currentStreak.durationSeconds += activity.duration;
      currentStreak.activitiesCount++;
    }
  }

  // Don't forget the last streak
  if (currentStreak && currentStreak.durationSeconds >= 300) {
    streaks.push(currentStreak);
  }

  return streaks.sort((a, b) => b.durationSeconds - a.durationSeconds);
}

/**
 * Get local date key in YYYY-MM-DD format
 */
function getLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export data for AI analysis of deep work patterns
 */
export async function getAIExportData({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}): Promise<AIExportData> {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all time entries in range
  const entriesResult = await db
    .select({
      id: timeEntries.id,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      duration: timeEntries.duration,
      isFocusMode: timeEntries.isFocusMode,
      targetDuration: timeEntries.targetDuration,
      description: timeEntries.description,
      boardId: timeEntries.boardId,
      itemId: timeEntries.itemId,
      boardName: boards.name,
      boardColor: boards.color,
      itemTitle: items.title,
    })
    .from(timeEntries)
    .leftJoin(boards, eq(timeEntries.boardId, boards.id))
    .leftJoin(items, eq(timeEntries.itemId, items.id))
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.startTime, startOfDay.getTime()),
        lte(timeEntries.startTime, endOfDay.getTime())
      )
    )
    .orderBy(desc(timeEntries.startTime));

  // Process each session
  const sessions: SessionMetrics[] = [];
  const dailyStatsMap = new Map<string, DailyStats>();

  for (const entry of entriesResult) {
    // Fetch activities for this session
    const activitiesResult = await db
      .select({
        timestamp: activities.timestamp,
        ownerName: activities.ownerName,
        title: activities.title,
        url: activities.url,
        duration: activities.duration,
        rating: activities.rating,
        categoryId: activities.categoryId,
        categoryName: categories.name,
        categoryPath: categories.path,
      })
      .from(activities)
      .leftJoin(categories, eq(activities.categoryId, categories.id))
      .where(eq(activities.timeEntryId, entry.id))
      .orderBy(activities.timestamp);

    // Map to SessionActivity format
    const sessionActivities: SessionActivity[] = activitiesResult.map((a) => ({
      timestamp: a.timestamp,
      appName: a.ownerName,
      title: a.title,
      url: a.url,
      domain: extractDomain(a.url),
      duration: a.duration,
      rating: a.rating,
      categoryPath: a.categoryPath,
      categoryName: a.categoryName,
    }));

    // Calculate metrics
    const contextSwitches = calculateContextSwitches(sessionActivities);
    const focusStreaks = calculateFocusStreaks(sessionActivities);

    const totalDurationSeconds = entry.duration ?? 0;
    const totalFocusSeconds = sessionActivities
      .filter((a) => a.rating === 1)
      .reduce((sum, a) => sum + a.duration, 0);
    const totalDistractedSeconds = sessionActivities
      .filter((a) => a.rating === 0)
      .reduce((sum, a) => sum + a.duration, 0);
    const totalUnratedSeconds = sessionActivities
      .filter((a) => a.rating === null)
      .reduce((sum, a) => sum + a.duration, 0);

    const longestStreakSeconds = focusStreaks.length > 0 ? focusStreaks[0].durationSeconds : 0;

    const uniqueApps = new Set(sessionActivities.map((a) => a.appName));

    const activityDuration = sessionActivities.reduce((sum, a) => sum + a.duration, 0) || 1;
    const productivityScore =
      activityDuration > 0 ? Math.round((totalFocusSeconds / activityDuration) * 100) : 0;

    const sessionMetrics: SessionMetrics = {
      id: entry.id,
      startTime: entry.startTime,
      endTime: entry.endTime,
      isFocusMode: entry.isFocusMode ?? true,
      targetDuration: entry.targetDuration,
      taskName: entry.itemTitle,
      projectName: entry.boardName,
      projectColor: entry.boardColor,
      description: entry.description,
      totalDurationSeconds,
      totalFocusSeconds,
      totalDistractedSeconds,
      totalUnratedSeconds,
      contextSwitchCount: contextSwitches.length,
      longestFocusStreakSeconds: longestStreakSeconds,
      averageActivityDurationSeconds:
        sessionActivities.length > 0 ? Math.round(activityDuration / sessionActivities.length) : 0,
      uniqueAppsUsed: uniqueApps.size,
      productivityScore,
      activities: sessionActivities,
      contextSwitches,
      focusStreaks,
    };

    sessions.push(sessionMetrics);

    // Aggregate into daily stats
    const dateKey = getLocalDateKey(entry.startTime);
    if (!dailyStatsMap.has(dateKey)) {
      dailyStatsMap.set(dateKey, {
        date: dateKey,
        totalFocusTimeSeconds: 0,
        totalBreakTimeSeconds: 0,
        totalProductiveSeconds: 0,
        totalDistractedSeconds: 0,
        contextSwitchCount: 0,
        deepWorkBlocksCount: 0,
        sessionsCount: 0,
        focusSessionsCount: 0,
        breakSessionsCount: 0,
        averageSessionDurationSeconds: 0,
        longestSessionSeconds: 0,
        productivityScore: 0,
        topApps: [],
        topCategories: [],
        peakProductivityHour: null,
      });
    }

    const daily = dailyStatsMap.get(dateKey)!;
    daily.sessionsCount++;

    if (entry.isFocusMode) {
      daily.focusSessionsCount++;
      daily.totalFocusTimeSeconds += totalDurationSeconds;
    } else {
      daily.breakSessionsCount++;
      daily.totalBreakTimeSeconds += totalDurationSeconds;
    }

    daily.totalProductiveSeconds += totalFocusSeconds;
    daily.totalDistractedSeconds += totalDistractedSeconds;
    daily.contextSwitchCount += contextSwitches.length;

    // Check if this is a deep work block (>25min with <3 macro switches)
    const macroSwitches = contextSwitches.filter((s) => s.switchType === "macro").length;
    if (totalDurationSeconds >= 1500 && macroSwitches < 3) {
      daily.deepWorkBlocksCount++;
    }

    if (totalDurationSeconds > daily.longestSessionSeconds) {
      daily.longestSessionSeconds = totalDurationSeconds;
    }
  }

  // Finalize daily stats
  const dailyStats: DailyStats[] = [];
  for (const [dateKey, daily] of dailyStatsMap) {
    // Calculate average session duration
    daily.averageSessionDurationSeconds =
      daily.sessionsCount > 0
        ? Math.round(
            (daily.totalFocusTimeSeconds + daily.totalBreakTimeSeconds) / daily.sessionsCount
          )
        : 0;

    // Calculate daily productivity score
    const totalActivityTime = daily.totalProductiveSeconds + daily.totalDistractedSeconds;
    daily.productivityScore =
      totalActivityTime > 0
        ? Math.round((daily.totalProductiveSeconds / totalActivityTime) * 100)
        : 0;

    // Get top apps for this day
    const dayActivities = sessions
      .filter((s) => getLocalDateKey(s.startTime) === dateKey)
      .flatMap((s) => s.activities);

    const appDurations = new Map<string, { duration: number; rating: number | null }>();
    for (const activity of dayActivities) {
      const existing = appDurations.get(activity.appName);
      if (existing) {
        existing.duration += activity.duration;
      } else {
        appDurations.set(activity.appName, {
          duration: activity.duration,
          rating: activity.rating,
        });
      }
    }

    daily.topApps = Array.from(appDurations.entries())
      .map(([app, data]) => ({ app, duration: data.duration, rating: data.rating }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Get top categories
    const categoryDurations = new Map<string, number>();
    for (const activity of dayActivities) {
      if (activity.categoryName) {
        const existing = categoryDurations.get(activity.categoryName) ?? 0;
        categoryDurations.set(activity.categoryName, existing + activity.duration);
      }
    }

    daily.topCategories = Array.from(categoryDurations.entries())
      .map(([category, duration]) => ({ category, duration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    dailyStats.push(daily);
  }

  // Sort daily stats by date
  dailyStats.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate summary
  const totalFocusSessions = sessions.filter((s) => s.isFocusMode).length;
  const totalBreakSessions = sessions.filter((s) => !s.isFocusMode).length;
  const totalFocusTimeSeconds = dailyStats.reduce((sum, d) => sum + d.totalFocusTimeSeconds, 0);
  const totalBreakTimeSeconds = dailyStats.reduce((sum, d) => sum + d.totalBreakTimeSeconds, 0);
  const totalContextSwitches = dailyStats.reduce((sum, d) => sum + d.contextSwitchCount, 0);
  const deepWorkBlocksCount = dailyStats.reduce((sum, d) => sum + d.deepWorkBlocksCount, 0);
  const longestFocusStreakSeconds = Math.max(
    ...sessions.map((s) => s.longestFocusStreakSeconds),
    0
  );
  const averageProductivityScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.productivityScore, 0) / sessions.length)
      : 0;

  return {
    exportedAt: Date.now(),
    userId,
    dateRange: {
      startDate: getLocalDateKey(startOfDay.getTime()),
      endDate: getLocalDateKey(endOfDay.getTime()),
    },
    summary: {
      totalSessions: sessions.length,
      totalFocusSessions,
      totalBreakSessions,
      totalFocusTimeSeconds,
      totalBreakTimeSeconds,
      totalContextSwitches,
      averageProductivityScore,
      deepWorkBlocksCount,
      longestFocusStreakSeconds,
    },
    sessions,
    dailyStats,
  };
}

/**
 * Export data in a simplified format for LLM context windows
 * (Reduces payload size by omitting detailed activity lists)
 */
export async function getAIExportDataCompact({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}): Promise<Omit<AIExportData, "sessions"> & { sessions: Omit<SessionMetrics, "activities">[] }> {
  const fullExport = await getAIExportData({ userId, startDate, endDate });

  return {
    ...fullExport,
    sessions: fullExport.sessions.map(({ activities, ...session }) => session),
  };
}

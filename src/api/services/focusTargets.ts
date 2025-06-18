import db from "../db";
import { focusTargets, activities } from "../db/schema";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * TIMESTAMP AND TIMEZONE CONVENTIONS FOR THIS SERVICE
 * ===================================================
 *
 * IMPORTANT: This service follows the same patterns as activities.ts/getProductivityStats
 * to ensure consistency across the codebase.
 *
 * TIMESTAMP STORAGE:
 * - All timestamps in the database are stored in MILLISECONDS (not seconds)
 * - Use activities.timestamp directly in queries without division
 *
 * TIMEZONE HANDLING:
 * - Always use LOCAL TIME for day boundaries, not UTC
 * - Use setHours(0, 0, 0, 0) for start of day
 * - Use setHours(23, 59, 59, 999) for end of day
 *
 * QUERY PATTERNS:
 * - Use sql template literals for timestamp comparisons: sql`${activities.timestamp} >= ${startTime}`
 * - Use <= for end boundaries to include activities at day end
 * - Always use getTime() to get millisecond timestamps
 *
 * REFERENCE IMPLEMENTATION:
 * See getProductivityStats() in activities.ts for the canonical pattern
 */

export interface FocusTarget {
  id: string;
  userId: string;
  targetMinutes: number;
  enableReminders: boolean;
  reminderIntervalMinutes: number;
  createdAt: number;
  updatedAt: number;
}

export interface DailyProgress {
  targetMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  remainingMinutes: number;
  isCompleted: boolean;
  sessionsToday: number;
}

/**
 * Get or create focus target for a user
 */
export async function getFocusTarget(userId: string): Promise<FocusTarget | null> {
  const target = await db
    .select()
    .from(focusTargets)
    .where(eq(focusTargets.userId, userId))
    .limit(1);

  return target[0] || null;
}

/**
 * Create or update focus target for a user
 */
export async function upsertFocusTarget(
  userId: string,
  targetMinutes: number,
  enableReminders: boolean = true,
  reminderIntervalMinutes: number = 60
): Promise<FocusTarget> {
  const now = Date.now();
  const existingTarget = await getFocusTarget(userId);

  if (existingTarget) {
    // Update existing target
    const updated = await db
      .update(focusTargets)
      .set({
        targetMinutes,
        enableReminders,
        reminderIntervalMinutes,
        updatedAt: now,
      })
      .where(eq(focusTargets.userId, userId))
      .returning();

    return updated[0];
  } else {
    // Create new target
    const newTarget = {
      id: uuidv4(),
      userId,
      targetMinutes,
      enableReminders,
      reminderIntervalMinutes,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.insert(focusTargets).values(newTarget).returning();
    return created[0];
  }
}

/**
 * Get today's focus progress for a user
 *
 * IMPLEMENTATION NOTES:
 * - Follows the same timestamp/timezone patterns as getProductivityStats() in activities.ts
 * - Uses LOCAL TIME (not UTC) for day boundaries to match user's timezone
 * - Timestamps are in MILLISECONDS and used directly without conversion
 * - Queries only activities where isFocusMode = true for focus time calculation
 *
 * @param userId - The user ID to get progress for
 * @returns DailyProgress object with focus stats for today, or null if no target set
 */
export async function getTodaysFocusProgress(userId: string): Promise<DailyProgress | null> {
  const target = await getFocusTarget(userId);
  if (!target) return null;

  // Get start and end of today in local time (matching getProductivityStats)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Query today's focus time activities
  const todaysActivities = await db
    .select({
      totalDuration: sql<number>`COALESCE(SUM(${activities.duration}), 0)`,
      sessionCount: sql<number>`COUNT(DISTINCT ${activities.timeEntryId})`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.isFocusMode, true),
        sql`${activities.timestamp} >= ${startOfDay}`,
        sql`${activities.timestamp} <= ${endOfDay.getTime()}`
      )
    );

  const completedMinutes = Math.floor((todaysActivities[0]?.totalDuration || 0) / 60);

  // Ensure safe calculation of progress percentage
  const progressPercentage =
    target.targetMinutes > 0
      ? Math.min(100, Math.max(0, (completedMinutes / target.targetMinutes) * 100))
      : 0;

  const remainingMinutes = Math.max(0, target.targetMinutes - completedMinutes);
  const isCompleted = completedMinutes >= target.targetMinutes;
  const sessionsToday = todaysActivities[0]?.sessionCount || 0;

  return {
    targetMinutes: target.targetMinutes,
    completedMinutes,
    progressPercentage: Number.isFinite(progressPercentage) ? progressPercentage : 0,
    remainingMinutes,
    isCompleted,
    sessionsToday,
  };
}

/**
 * Check if user needs a reminder based on their progress and settings
 */
export async function shouldSendReminder(userId: string): Promise<{
  shouldSend: boolean;
  message: string;
  progress?: DailyProgress;
}> {
  const target = await getFocusTarget(userId);
  if (!target || !target.enableReminders) {
    return { shouldSend: false, message: "" };
  }

  const progress = await getTodaysFocusProgress(userId);
  if (!progress) {
    return { shouldSend: false, message: "" };
  }

  // Don't send reminders if target is already completed
  if (progress.isCompleted) {
    return { shouldSend: false, message: "", progress };
  }

  // Calculate time since last potential reminder
  const now = new Date();
  const currentHour = now.getHours();

  // Only send reminders during work hours (8 AM to 8 PM)
  if (currentHour < 8 || currentHour > 20) {
    return { shouldSend: false, message: "", progress };
  }

  // Generate motivational message based on progress
  let message = "";
  if (progress.progressPercentage === 0) {
    message = `⏰ Ready to start your day? You have ${target.targetMinutes} minutes of focus time to achieve today!`;
  } else if (progress.progressPercentage < 25) {
    message = `🚀 You've logged ${progress.completedMinutes} minutes so far. Keep going - ${progress.remainingMinutes} minutes left to reach your daily goal!`;
  } else if (progress.progressPercentage < 50) {
    message = `💪 Great progress! You're ${Math.round(progress.progressPercentage)}% toward your goal. ${progress.remainingMinutes} minutes remaining.`;
  } else if (progress.progressPercentage < 75) {
    message = `🔥 You're more than halfway there! ${progress.remainingMinutes} minutes left to complete your ${target.targetMinutes}-minute goal.`;
  } else {
    message = `🎯 Almost there! Just ${progress.remainingMinutes} more minutes to reach your daily focus target. You've got this!`;
  }

  return { shouldSend: true, message, progress };
}

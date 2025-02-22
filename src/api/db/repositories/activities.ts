import { ActivityRecord } from "@/types/activity";
import { isNullOrUndefined } from "@/utils/value-checks";

import db from "..";
import { activities } from "../schema";

import { gte, desc, and, eq, sql, lte } from "drizzle-orm";
import { LIMIT_TIME_APART } from "../../../config/tracking";

export const getActivities = async (date?: number): Promise<ActivityRecord[]> => {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000; // 15 minutes in milliseconds

  const results = await db
    .select()
    .from(activities)
    .where(gte(activities.timestamp, date || fifteenMinutesAgo))
    .orderBy(desc(activities.timestamp))
    .limit(1000);

  return results;
};

export const clearActivities = async (date?: string): Promise<void> => {
  await db.delete(activities).all();
};

// Find matching activities using the composite index
const findMatchingActivity = async (
  activity: ActivityRecord
): Promise<ActivityRecord | undefined> => {
  const query = db
    .select()
    .from(activities)
    .where(
      and(
        // Use composite index for matching fields
        eq(activities.title, activity.title),
        isNullOrUndefined(activity.ownerBundleId)
          ? sql`${activities.ownerBundleId} is null`
          : eq(activities.ownerBundleId, activity.ownerBundleId),
        eq(activities.ownerName, activity.ownerName),
        eq(activities.ownerPath, activity.ownerPath),
        eq(activities.platform, activity.platform),
        isNullOrUndefined(activity.taskId)
          ? sql`${activities.taskId} is null`
          : eq(activities.taskId, activity.taskId),
        isNullOrUndefined(activity.isFocused)
          ? sql`${activities.isFocused} is null`
          : eq(activities.isFocused, activity.isFocused),
        gte(activities.timestamp, activity.timestamp - LIMIT_TIME_APART)
      )
    )
    .orderBy(desc(activities.timestamp))
    .limit(1);

  const result = await query;
  return result[0];
};

// Upsert activity with conflict detection using the composite index
export const upsertActivity = async (activity: ActivityRecord): Promise<void> => {
  const existingActivity = await findMatchingActivity(activity);

  if (existingActivity) {
    await db
      .update(activities)
      .set({
        duration: existingActivity.duration + activity.duration,
      })
      .where(eq(activities.timestamp, existingActivity.timestamp));

    return;
  }
  await db.insert(activities).values({
    timestamp: activity.timestamp,
    activityId: activity.activityId,
    platform: activity.platform,
    title: activity.title,
    ownerPath: activity.ownerPath,
    ownerProcessId: activity.ownerProcessId,
    ownerBundleId: activity.ownerBundleId,
    ownerName: activity.ownerName,
    url: activity.url,
    duration: activity.duration,
    taskId: activity.taskId,
    isFocused: activity.isFocused,
    userId: activity.userId,
  });
};

export const getFocusedTimeByHour = async (
  date: number
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
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
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
      totalFocusedTime: sql<number>`sum(CASE WHEN ${activities.isFocused} = 1 THEN ${activities.duration} ELSE 0 END)`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime())
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
        eq(activities.isFocused, true)
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

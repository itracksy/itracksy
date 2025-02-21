import { ActivityRecord } from "@/types/activity";

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
export const findMatchingActivity = async (
  activity: ActivityRecord
): Promise<ActivityRecord | undefined> => {
  const query = db
    .select()
    .from(activities)
    .where(
      and(
        // Use composite index for matching fields
        eq(activities.title, activity.title),
        !activity.ownerBundleId
          ? sql`${activities.ownerBundleId} is null`
          : eq(activities.ownerBundleId, activity.ownerBundleId),
        eq(activities.ownerName, activity.ownerName),
        eq(activities.ownerPath, activity.ownerPath),
        eq(activities.platform, activity.platform),
        !activity.taskId
          ? sql`${activities.taskId} is null`
          : eq(activities.taskId, activity.taskId),
        !activity.isFocused
          ? sql`1=1` // If isFocused is undefined, don't filter on it
          : eq(activities.isFocused, activity.isFocused),
        gte(activities.timestamp, activity.timestamp - LIMIT_TIME_APART)
      )
    )
    .orderBy(desc(activities.timestamp))
    .prepare();

  const result = await query.execute();
  return result[0];
};

// Upsert activity with conflict detection using the composite index
export const upsertActivity = async (activity: ActivityRecord): Promise<void> => {
  const existingActivity = await findMatchingActivity(activity);
  console.log("[upsertActivity] Existing activity:", existingActivity);
  console.log("[upsertActivity] Activity to upsert:", activity);
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
): Promise<{ hour: number; totalFocusedTime: number }[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log("[getFocusedTimeByHour] Query params:", {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString(),
    startTimestamp: startOfDay.getTime(),
    endTimestamp: endOfDay.getTime(),
  });

  // First check if we have any activities in this time range
  const activityCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime())
      )
    );

  console.log("[getFocusedTimeByHour] Activity count in range:", activityCount[0].count);

  // Check focused activities specifically
  const focusedCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime()),
        eq(activities.isFocused, true)
      )
    );

  console.log("[getFocusedTimeByHour] Focused activity count:", focusedCount[0].count);

  const results = await db
    .select({
      hour: sql<number>`cast(strftime('%H', datetime(${activities.timestamp} / 1000, 'unixepoch')) as integer)`,
      totalFocusedTime: sql<number>`sum(CASE WHEN ${activities.isFocused} = 1 THEN ${activities.duration} ELSE 0 END)`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfDay.getTime()),
        lte(activities.timestamp, endOfDay.getTime())
      )
    )
    .groupBy(sql`strftime('%H', datetime(${activities.timestamp} / 1000, 'unixepoch'))`)
    .orderBy(
      sql`cast(strftime('%H', datetime(${activities.timestamp} / 1000, 'unixepoch')) as integer)`
    );

  console.log("[getFocusedTimeByHour] Results:", {
    hourlyData: results,
    sampleTimestamp: results[0]?.hour ? new Date(date).setHours(results[0].hour) : null,
  });

  return results;
};

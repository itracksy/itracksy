import { ActivityRecord } from "@/types/activity";

import db from "..";
import { activities } from "../schema";

import { gte, desc, and, eq, sql } from "drizzle-orm";
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
        gte(activities.timestamp, activity.timestamp - LIMIT_TIME_APART)
      )
    )
    .orderBy(desc(activities.timestamp))
    .prepare();

  const result = await query.execute().then((rows) => rows[0]);

  return result;
};

// Upsert activity with conflict detection using the composite index
export const upsertActivity = async (activity: ActivityRecord): Promise<void> => {
  const existingActivity = await findMatchingActivity(activity);

  if (existingActivity) {
    await db
      .update(activities)
      .set({
        duration: existingActivity.duration + activity.duration,
        isFocused: activity.isFocused,
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

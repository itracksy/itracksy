import { Activity } from "@/types/activity";
import { isNullOrUndefined } from "../../utils/value-checks";

import { gte, desc, and, eq, sql, isNull } from "drizzle-orm";
import { LIMIT_TIME_APART } from "../../config/tracking";
import db from "../db";
import { activities } from "../db/schema";
import { rateActivity } from "./activityRating";
import { CreateRuleParams } from "./activityRules";
import { generateRuleSuggestions } from "./activityRatingHelper";

export const getActivities = async (date?: number): Promise<Activity[]> => {
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
const findMatchingActivity = async (activity: Activity): Promise<Activity | undefined> => {
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
        isNullOrUndefined(activity.timeEntryId)
          ? sql`${activities.timeEntryId} is null`
          : eq(activities.timeEntryId, activity.timeEntryId),
        gte(activities.timestamp, activity.timestamp - LIMIT_TIME_APART)
      )
    )
    .orderBy(desc(activities.timestamp))
    .limit(1);

  const result = await query;
  return result[0];
};

// Upsert activity with conflict detection using the composite index
export const upsertActivity = async (activity: Activity): Promise<void> => {
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
    isFocusMode: activity.isFocusMode,
    activityId: activity.activityId,
    platform: activity.platform,
    title: activity.title,
    ownerPath: activity.ownerPath,
    ownerProcessId: activity.ownerProcessId,
    ownerBundleId: activity.ownerBundleId,
    ownerName: activity.ownerName,
    url: activity.url,
    duration: activity.duration,
    timeEntryId: activity.timeEntryId,
    userId: activity.userId,
  });
};

/**
 * Track a new activity with automatic rating
 */
export async function trackActivity(activityData: Omit<Activity, "rating">) {
  // Insert the activity first
  const inserted = await db
    .insert(activities)
    .values({
      ...activityData,
      rating: null,
    })
    .returning();

  const activity = inserted[0];

  // Rate the activity using rules
  await rateActivity(activity);

  return activity;
}

/**
 * Get activities for a user with pagination
 */
export async function getUserActivities({
  userId,
  limit = 100,
  offset = 0,
  timeEntryId = null,
  ratingFilter = null, // null = all, 0 = bad, 1 = good, -1 = unrated
}: {
  userId: string;
  limit?: number;
  offset?: number;
  timeEntryId?: string | null;
  ratingFilter?: number | null;
}) {
  const query = db.query.activities.findMany({
    where: (() => {
      const conditions = [eq(activities.userId, userId)];

      if (timeEntryId) {
        conditions.push(eq(activities.timeEntryId, timeEntryId));
      }

      if (ratingFilter !== null) {
        if (ratingFilter === -1) {
          conditions.push(isNull(activities.rating));
        } else {
          conditions.push(eq(activities.rating, ratingFilter));
        }
      }

      return and(...conditions);
    })(),
    orderBy: [desc(activities.timestamp)],
    limit,
    offset,
  });

  return query;
}

/**
 * Manually set a rating for an activity
 */
export async function setActivityRating(timestamp: number, userId: string, rating: number | null) {
  const updatedActivities = await db
    .update(activities)
    .set({ rating })
    .where(and(eq(activities.timestamp, timestamp), eq(activities.userId, userId)))
    .returning();

  // Return the single updated activity or null if not found
  return updatedActivities[0] || null;
}

/**
 * Get productivity stats based on activity ratings
 */
export async function getProductivityStats(userId: string, startTime: number, endTime: number) {
  const result = await db
    .select({
      totalDuration: sql`SUM(${activities.duration})`,
      goodDuration: sql`SUM(CASE WHEN ${activities.rating} = 1 THEN ${activities.duration} ELSE 0 END)`,
      badDuration: sql`SUM(CASE WHEN ${activities.rating} = 0 THEN ${activities.duration} ELSE 0 END)`,
      unratedDuration: sql`SUM(CASE WHEN ${activities.rating} IS NULL THEN ${activities.duration} ELSE 0 END)`,
      activityCount: sql`COUNT(*)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        sql`${activities.timestamp} >= ${startTime}`,
        sql`${activities.timestamp} <= ${endTime}`
      )
    );

  return result[0];
}

import { Activity } from "@/types/activity";
import { isNullOrUndefined } from "../../utils/value-checks";

import { gte, desc, and, eq, sql, isNull } from "drizzle-orm";
import { LIMIT_TIME_APART } from "../../config/tracking";
import db from "../db";
import { activities } from "../db/schema";
import { rateActivity } from "./activityRating";
import { categorizeNewActivity } from "./category/auto-categorize";

/**
 * TIMESTAMP AND TIMEZONE PATTERNS
 * ===============================
 * This file contains the reference implementations for timestamp and timezone handling.
 * See docs/TIMESTAMP_CONVENTIONS.md for detailed documentation.
 *
 * Key functions that establish patterns:
 * - getProductivityStats() - Primary reference for timestamp queries
 */

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
        rating: activity.rating,
      })
      .where(eq(activities.timestamp, existingActivity.timestamp));

    return;
  }

  // Insert new activity
  await db.insert(activities).values(activity);

  // Automatically categorize the new activity
  if (activity.userId) {
    try {
      await categorizeNewActivity(activity.timestamp, activity.userId);
    } catch (error) {
      console.error("Failed to auto-categorize activity:", error);
      // Don't throw error - categorization failure shouldn't break activity creation
    }
  }
};

/**
 * Track a new activity with automatic rating and categorization
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

  // Automatically categorize the activity
  if (activity.userId) {
    try {
      await categorizeNewActivity(activity.timestamp, activity.userId);
    } catch (error) {
      console.error("Failed to auto-categorize activity:", error);
      // Don't throw error - categorization failure shouldn't break activity creation
    }
  }

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
export async function setActivityRating(
  timestamp: number,
  userId: string,
  rating: number | null,
  activityRuleId?: string
) {
  const updatedActivities = await db
    .update(activities)
    .set({
      rating,
      ...(activityRuleId && { activityRuleId }), // Only include activityRuleId in the update if it's provided
    })
    .where(and(eq(activities.timestamp, timestamp), eq(activities.userId, userId)))
    .returning();

  // Return the single updated activity or null if not found
  return updatedActivities[0] || null;
}

/**
 * Get productivity stats based on activity ratings
 *
 * REFERENCE IMPLEMENTATION FOR TIMESTAMP/TIMEZONE PATTERNS:
 * This function establishes the canonical patterns for handling timestamps and timezones
 * across the application. Other services should follow these same patterns:
 *
 * TIMESTAMP HANDLING:
 * - Database stores timestamps in MILLISECONDS
 * - Use sql template literals: sql`${activities.timestamp} >= ${startTime}`
 * - Always use getTime() to get millisecond timestamps
 *
 * TIMEZONE HANDLING:
 * - Use LOCAL TIME for day boundaries (setHours, not setUTCHours)
 * - Start of day: setHours(0, 0, 0, 0)
 * - End of day: setHours(23, 59, 59, 999)
 *
 * @param params - Object containing userId, startTime, and optional endTime
 * @returns Object with productivity statistics for the time period
 */
export async function getProductivityStats({
  userId,
  startTime,
  endTime,
}: {
  userId: string;
  startTime: number;
  endTime?: number;
}) {
  const startOfDay = new Date(startTime);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endTime ?? startTime);
  endOfDay.setHours(23, 59, 59, 999);
  const result = await db
    .select({
      totalDuration: sql`SUM(${activities.duration})`,
      productiveDuration: sql`SUM(CASE WHEN ${activities.rating} = 1 THEN ${activities.duration} ELSE 0 END)`,
      distractingDuration: sql`SUM(CASE WHEN ${activities.rating} = 0 THEN ${activities.duration} ELSE 0 END)`,
      activityCount: sql`COUNT(*)`,
      focusSessionCount: sql`COUNT(DISTINCT ${activities.timeEntryId})`,
      ratedActivityCount: sql`COUNT(CASE WHEN ${activities.rating} IS NOT NULL THEN 1 ELSE NULL END)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        sql`${activities.timestamp} >= ${startOfDay.getTime()}`,
        sql`${activities.timestamp} <= ${endOfDay.getTime()}`
      )
    );

  // Convert SQL results to numbers with fallback to 0 for null values
  return {
    totalDuration: Number(result[0].totalDuration || 0),
    productiveDuration: Number(result[0].productiveDuration || 0),
    distractingDuration: Number(result[0].distractingDuration || 0),
    activityCount: Number(result[0].activityCount || 0),
    focusSessionCount: Number(result[0].focusSessionCount || 0),
    ratedActivityCount: Number(result[0].ratedActivityCount || 0),
  };
}

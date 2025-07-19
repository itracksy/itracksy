import { eq } from "drizzle-orm";
import { matchActivityToCategory } from "./category-matching";
import db from "@/api/db";
import { activities, categories, categoryMappings } from "@/api/db/schema";

/**
 * Automatically categorizes a new activity when it's created
 * This should be called whenever a new activity is inserted
 */
export const categorizeNewActivity = async (
  activityTimestamp: number,
  userId: string
): Promise<boolean> => {
  // Get the activity data
  const activity = await db
    .select({
      ownerName: activities.ownerName,
      url: activities.url,
      title: activities.title,
    })
    .from(activities)
    .where(eq(activities.timestamp, activityTimestamp))
    .limit(1);

  if (!activity[0]) {
    return false;
  }

  // Try to match it to a category
  const match = await matchActivityToCategory(
    {
      ownerName: activity[0].ownerName,
      url: activity[0].url,
      title: activity[0].title,
    },
    userId
  );

  if (match) {
    // Update the activity with the matched category
    await db
      .update(activities)
      .set({
        categoryId: match.categoryId,
      })
      .where(eq(activities.timestamp, activityTimestamp));

    return true;
  }

  return false;
};

/**
 * Gets category statistics for a user
 */
export const getCategoryStats = async (
  userId: string,
  startDate?: number,
  endDate?: number
): Promise<{
  readonly totalCategories: number;
  readonly totalMappings: number;
  readonly categorizedActivities: number;
  readonly uncategorizedActivities: number;
  readonly topCategories: readonly {
    readonly categoryId: string;
    readonly categoryName: string;
    readonly activityCount: number;
    readonly totalDuration: number;
  }[];
}> => {
  const { sql, and, isNull, desc, gte, lte } = await import("drizzle-orm");

  // Create time range filter conditions
  const timeFilters = [];
  if (startDate !== undefined) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    timeFilters.push(gte(activities.timestamp, startOfDay.getTime()));
  }
  if (endDate !== undefined) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    timeFilters.push(lte(activities.timestamp, endOfDay.getTime()));
  }

  // Get total categories (not time-filtered)
  const totalCategoriesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(categories);

  // Get total mappings (not time-filtered)
  const totalMappingsResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(categoryMappings);

  // Get categorized activities count (with time filter)
  const categorizedActivitiesConditions = [
    eq(activities.userId, userId),
    sql`${activities.categoryId} IS NOT NULL`,
    ...timeFilters,
  ];
  const categorizedActivitiesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(activities)
    .where(and(...categorizedActivitiesConditions));

  // Get uncategorized activities count (with time filter)
  const uncategorizedActivitiesConditions = [
    eq(activities.userId, userId),
    isNull(activities.categoryId),
    ...timeFilters,
  ];
  const uncategorizedActivitiesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(activities)
    .where(and(...uncategorizedActivitiesConditions));

  // Get top categories by activity count (with time filter)
  const topCategoriesConditions = [
    eq(activities.userId, userId),
    sql`${activities.categoryId} IS NOT NULL`,
    ...timeFilters,
  ];
  const topCategoriesResult = await db
    .select({
      categoryId: activities.categoryId,
      categoryName: categories.name,
      activityCount: sql<number>`count(*)`.as("activityCount"),
      totalDuration: sql<number>`sum(${activities.duration})`.as("totalDuration"),
    })
    .from(activities)
    .innerJoin(categories, eq(activities.categoryId, categories.id))
    .where(and(...topCategoriesConditions))
    .groupBy(activities.categoryId, categories.name)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return {
    totalCategories: totalCategoriesResult[0]?.count || 0,
    totalMappings: totalMappingsResult[0]?.count || 0,
    categorizedActivities: categorizedActivitiesResult[0]?.count || 0,
    uncategorizedActivities: uncategorizedActivitiesResult[0]?.count || 0,
    topCategories: topCategoriesResult.map((row) => ({
      categoryId: row.categoryId!,
      categoryName: row.categoryName,
      activityCount: row.activityCount,
      totalDuration: row.totalDuration || 0,
    })),
  };
};

/**
 * Gets uncategorized activities for a user within a time range
 */
export const getUncategorizedActivities = async (
  userId: string,
  startDate?: number,
  endDate?: number,
  limit: number = 10
): Promise<
  readonly {
    readonly timestamp: number;
    readonly ownerName: string;
    readonly url: string | null;
    readonly title: string;
    readonly duration: number;
  }[]
> => {
  const { and, isNull, desc, gte, lte } = await import("drizzle-orm");

  // Create time range filter conditions
  const timeFilters = [];
  if (startDate !== undefined) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    timeFilters.push(gte(activities.timestamp, startOfDay.getTime()));
  }
  if (endDate !== undefined) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    timeFilters.push(lte(activities.timestamp, endOfDay.getTime()));
  }

  // Get uncategorized activities
  const conditions = [eq(activities.userId, userId), isNull(activities.categoryId), ...timeFilters];

  const uncategorizedActivities = await db
    .select({
      timestamp: activities.timestamp,
      ownerName: activities.ownerName,
      url: activities.url,
      title: activities.title,
      duration: activities.duration,
    })
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.duration)) // Order by duration to show longest activities first
    .limit(limit);

  return uncategorizedActivities;
};

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
  userId: string
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
  const { sql, and, isNull, desc } = await import("drizzle-orm");

  // Get total categories
  const totalCategoriesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(categories);

  // Get total mappings
  const totalMappingsResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(categoryMappings);

  // Get categorized activities count
  const categorizedActivitiesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(activities)
    .where(and(eq(activities.userId, userId), sql`${activities.categoryId} IS NOT NULL`));

  // Get uncategorized activities count
  const uncategorizedActivitiesResult = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(activities)
    .where(and(eq(activities.userId, userId), isNull(activities.categoryId)));

  // Get top categories by activity count
  const topCategoriesResult = await db
    .select({
      categoryId: activities.categoryId,
      categoryName: categories.name,
      activityCount: sql<number>`count(*)`.as("activityCount"),
      totalDuration: sql<number>`sum(${activities.duration})`.as("totalDuration"),
    })
    .from(activities)
    .innerJoin(categories, eq(activities.categoryId, categories.id))
    .where(and(eq(activities.userId, userId), sql`${activities.categoryId} IS NOT NULL`))
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

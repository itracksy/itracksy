import db from "@/api/db";
import { categoryMappings, activities } from "@/api/db/schema";
import {
  NewCategoryMapping,
  CategoryMapping,
  CategoryMatchResult,
  MatchType,
} from "@/types/category";

import { and, eq, desc, sql } from "drizzle-orm";

/**
 * Creates a new category mapping
 */
export const createCategoryMapping = async (
  mappingData: Omit<NewCategoryMapping, "id" | "createdAt" | "updatedAt">
): Promise<CategoryMapping> => {
  const now = Date.now();
  const id = `map_${Math.random().toString(36).substr(2, 9)}`;

  const newMapping: NewCategoryMapping = {
    ...mappingData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(categoryMappings).values(newMapping);

  return newMapping as CategoryMapping;
};

/**
 * Gets all category mappings
 */
export const getCategoryMappings = async (userId: string): Promise<readonly CategoryMapping[]> => {
  return db
    .select()
    .from(categoryMappings)
    .orderBy(desc(categoryMappings.priority), categoryMappings.createdAt);
};

/**
 * Gets category mappings for a specific category
 */
export const getCategoryMappingsForCategory = async (
  categoryId: string,
  userId: string
): Promise<readonly CategoryMapping[]> => {
  return db
    .select()
    .from(categoryMappings)
    .where(eq(categoryMappings.categoryId, categoryId))
    .orderBy(desc(categoryMappings.priority));
};

/**
 * Matches an activity against category mappings
 */
export const matchActivityToCategory = async (
  activityData: {
    readonly ownerName: string;
    readonly url?: string | null;
    readonly title: string;
  },
  userId: string
): Promise<CategoryMatchResult | null> => {
  const mappings = await db
    .select()
    .from(categoryMappings)
    .where(eq(categoryMappings.isActive, true))
    .orderBy(desc(categoryMappings.priority));

  for (const mapping of mappings) {
    const match = evaluateMatch(activityData, mapping);
    if (match) {
      return {
        categoryId: mapping.categoryId,
        confidence: match.confidence,
        matchedBy: match.matchedBy,
        mappingId: mapping.id,
      };
    }
  }

  return null;
};

/**
 * Evaluates if an activity matches a specific mapping
 */
const evaluateMatch = (
  activityData: {
    readonly ownerName: string;
    readonly url?: string | null;
    readonly title: string;
  },
  mapping: CategoryMapping
): { confidence: number; matchedBy: "appName" | "domain" | "title" } | null => {
  let maxConfidence = 0;
  let matchedBy: "appName" | "domain" | "title" | null = null;

  // Check app name match
  if (mapping.appName) {
    const appConfidence = evaluateStringMatch(
      activityData.ownerName,
      mapping.appName,
      mapping.matchType as MatchType
    );
    if (appConfidence > maxConfidence) {
      maxConfidence = appConfidence;
      matchedBy = "appName";
    }
  }

  // Check domain match
  if (mapping.domain && activityData.url) {
    const domain = extractDomainFromUrl(activityData.url);
    if (domain) {
      const domainConfidence = evaluateStringMatch(
        domain,
        mapping.domain,
        mapping.matchType as MatchType
      );
      if (domainConfidence > maxConfidence) {
        maxConfidence = domainConfidence;
        matchedBy = "domain";
      }
    }
  }

  // Check title pattern match
  if (mapping.titlePattern) {
    const titleConfidence = evaluateStringMatch(
      activityData.title,
      mapping.titlePattern,
      mapping.matchType as MatchType
    );
    if (titleConfidence > maxConfidence) {
      maxConfidence = titleConfidence;
      matchedBy = "title";
    }
  }

  // Return match if confidence is above threshold
  if (maxConfidence > 0.5 && matchedBy) {
    return { confidence: maxConfidence, matchedBy };
  }

  return null;
};

/**
 * Evaluates string matching based on match type
 */
const evaluateStringMatch = (input: string, pattern: string, matchType: MatchType): number => {
  const normalizedInput = input.toLowerCase().trim();
  const normalizedPattern = pattern.toLowerCase().trim();

  switch (matchType) {
    case "exact":
      return normalizedInput === normalizedPattern ? 1.0 : 0.0;

    case "contains":
      return normalizedInput.includes(normalizedPattern) ? 0.8 : 0.0;

    case "starts_with":
      return normalizedInput.startsWith(normalizedPattern) ? 0.9 : 0.0;

    case "regex":
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(input) ? 0.85 : 0.0;
      } catch {
        return 0.0; // Invalid regex
      }

    default:
      return 0.0;
  }
};

/**
 * Extracts domain from URL
 */
const extractDomainFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

/**
 * Bulk categorizes uncategorized activities for a user
 */
export const categorizePendingActivities = async (
  userId: string
): Promise<{
  readonly categorized: number;
  readonly total: number;
}> => {
  // Get uncategorized activities
  const uncategorizedActivities = await db
    .select({
      timestamp: activities.timestamp,
      ownerName: activities.ownerName,
      url: activities.url,
      title: activities.title,
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), sql`${activities.categoryId} IS NULL`));

  let categorizedCount = 0;

  for (const activity of uncategorizedActivities) {
    const match = await matchActivityToCategory(
      {
        ownerName: activity.ownerName,
        url: activity.url,
        title: activity.title,
      },
      userId
    );

    if (match) {
      await db
        .update(activities)
        .set({
          categoryId: match.categoryId,
        })
        .where(eq(activities.timestamp, activity.timestamp));

      categorizedCount++;
    }
  }

  return {
    categorized: categorizedCount,
    total: uncategorizedActivities.length,
  };
};

/**
 * Updates category mapping
 */
export const updateCategoryMapping = async (
  mappingId: string,
  updates: Partial<Omit<CategoryMapping, "id" | "createdAt" | "updatedAt">>,
  userId: string
): Promise<void> => {
  await db
    .update(categoryMappings)
    .set({
      ...updates,
      updatedAt: Date.now(),
    })
    .where(eq(categoryMappings.id, mappingId));
};

/**
 * Deletes category mapping
 */
export const deleteCategoryMapping = async (mappingId: string, userId: string): Promise<void> => {
  await db
    .delete(categoryMappings)
    .where(and(eq(categoryMappings.id, mappingId), eq(categoryMappings.userId, userId)));
};

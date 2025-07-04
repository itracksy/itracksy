import db from "@/api/db";
import { categories, categoryMappings } from "@/api/db/schema";
import { NewCategory, NewCategoryMapping } from "@/types/category";
import { eq, and } from "drizzle-orm";

/**
 * Copies system categories to a new user
 * This creates user-specific copies of the system categories and mappings
 */
export const copySystemCategoriesToUser = async (
  userId: string
): Promise<{
  readonly categoriesCreated: number;
  readonly mappingsCreated: number;
}> => {
  // Get all system categories
  const systemCategories = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, "system"), eq(categories.isSystem, true)))
    .orderBy(categories.level, categories.order);

  // Get all system category mappings
  const systemMappings = await db
    .select()
    .from(categoryMappings)
    .where(eq(categoryMappings.userId, "system"));

  const categoryIdMap = new Map<string, string>(); // old system ID -> new user ID
  const now = Date.now();
  let categoriesCreated = 0;
  let mappingsCreated = 0;

  // Create user categories based on system categories
  for (const systemCategory of systemCategories) {
    const newCategoryId = `cat_${userId}_${Math.random().toString(36).substr(2, 9)}`;

    // Map parent ID if it exists
    const newParentId = systemCategory.parentId
      ? categoryIdMap.get(systemCategory.parentId) || null
      : null;

    const newCategory: NewCategory = {
      id: newCategoryId,
      name: systemCategory.name,
      description: systemCategory.description,
      color: systemCategory.color,
      icon: systemCategory.icon,
      parentId: newParentId,
      path: systemCategory.path, // Will be the same structure
      level: systemCategory.level,
      order: systemCategory.order,
      userId,
      isSystem: false, // User categories are not system categories
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(categories).values(newCategory);
    categoryIdMap.set(systemCategory.id, newCategoryId);
    categoriesCreated++;
  }

  // Create user category mappings based on system mappings
  for (const systemMapping of systemMappings) {
    const newCategoryId = categoryIdMap.get(systemMapping.categoryId);
    if (newCategoryId) {
      const newMappingId = `map_${userId}_${Math.random().toString(36).substr(2, 9)}`;

      const newMapping: NewCategoryMapping = {
        id: newMappingId,
        categoryId: newCategoryId,
        appName: systemMapping.appName,
        domain: systemMapping.domain,
        titlePattern: systemMapping.titlePattern,
        matchType: systemMapping.matchType,
        priority: systemMapping.priority,
        userId,
        isActive: systemMapping.isActive,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(categoryMappings).values(newMapping);
      mappingsCreated++;
    }
  }

  return {
    categoriesCreated,
    mappingsCreated,
  };
};

/**
 * Checks if user already has categories
 */
export const hasUserCategories = async (userId: string): Promise<boolean> => {
  const userCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  return userCategories.length > 0;
};

/**
 * Seeds categories for a new user by copying from system categories
 * This is the recommended approach when using the migration-based seeding
 */
export const seedUserCategoriesFromSystem = async (
  userId: string
): Promise<{
  readonly seeded: boolean;
  readonly categoriesCreated: number;
  readonly mappingsCreated: number;
}> => {
  const hasCategories = await hasUserCategories(userId);

  if (hasCategories) {
    return {
      seeded: false,
      categoriesCreated: 0,
      mappingsCreated: 0,
    };
  }

  const result = await copySystemCategoriesToUser(userId);

  return {
    seeded: true,
    ...result,
  };
};

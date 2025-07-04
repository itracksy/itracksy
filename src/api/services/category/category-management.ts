import db from "@/api/db";
import { categories, activities } from "@/api/db/schema";
import { NewCategory, Category, CategoryTreeNode } from "@/types/category";

import { and, eq, isNull, sql, like } from "drizzle-orm";

/**
 * Creates a new category with automatic path generation
 */
export const createCategory = async (
  categoryData: Omit<NewCategory, "id" | "path" | "level" | "createdAt" | "updatedAt">
): Promise<Category> => {
  const now = Date.now();
  const id = `cat_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate path and level
  let path = `/${categoryData.name}`;
  let level = 0;

  if (categoryData.parentId) {
    const parent = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryData.parentId))
      .limit(1);

    if (parent[0]) {
      path = `${parent[0].path}/${categoryData.name}`;
      level = parent[0].level + 1;
    }
  }

  const newCategory: NewCategory = {
    ...categoryData,
    id,
    path,
    level,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(categories).values(newCategory);

  return newCategory as Category;
};

/**
 * Gets all categories as a flat list
 */
export const getCategories = async (userId: string): Promise<readonly Category[]> => {
  return db.select().from(categories).orderBy(categories.level, categories.order, categories.name);
};

/**
 * Gets root categories (no parent)
 */
export const getRootCategories = async (userId: string): Promise<readonly Category[]> => {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(categories.order, categories.name);
};

/**
 * Gets children of a specific category
 */
export const getCategoryChildren = async (
  categoryId: string,
  userId: string
): Promise<readonly Category[]> => {
  return db
    .select()
    .from(categories)
    .where(eq(categories.parentId, categoryId))
    .orderBy(categories.order, categories.name);
};

/**
 * Builds a complete category tree for a user
 */
export const getCategoryTree = async (userId: string): Promise<readonly CategoryTreeNode[]> => {
  const allCategories = await getCategories(userId);

  // Get activity counts for each category
  const categoryCounts = await db
    .select({
      categoryId: activities.categoryId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(activities)
    .where(and(eq(activities.userId, userId), sql`${activities.categoryId} IS NOT NULL`))
    .groupBy(activities.categoryId);

  const countMap = new Map<string, number>(
    categoryCounts.map((item: { categoryId: string | null; count: number }) => [
      item.categoryId!,
      item.count,
    ])
  );

  // Build tree structure
  const categoryMap = new Map<string, CategoryTreeNode>();
  const rootNodes: CategoryTreeNode[] = [];

  // First pass: create all nodes
  for (const category of allCategories) {
    const node: CategoryTreeNode = {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      path: category.path,
      level: category.level,
      order: category.order,
      children: [],
      activityCount: countMap.get(category.id) || 0,
    };
    categoryMap.set(category.id, node);
  }

  // Second pass: build parent-child relationships
  for (const category of allCategories) {
    const node = categoryMap.get(category.id)!;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        (parent.children as CategoryTreeNode[]).push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  // Sort children by order and name
  const sortNodes = (nodes: readonly CategoryTreeNode[]): readonly CategoryTreeNode[] => {
    return nodes
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
  };

  return sortNodes(rootNodes);
};

/**
 * Updates a category
 */
export const updateCategory = async (
  categoryId: string,
  updates: Partial<Omit<Category, "id" | "path" | "level" | "createdAt" | "updatedAt">>,
  userId: string
): Promise<void> => {
  const now = Date.now();

  // Update the category
  await db
    .update(categories)
    .set({
      ...updates,
      updatedAt: now,
    })
    .where(eq(categories.id, categoryId));

  // If name or parentId changed, update the path
  if (updates.name || updates.parentId !== undefined) {
    await updateCategoryPath(categoryId, userId);
  }
};

/**
 * Updates category path when parent changes or name changes
 */
export const updateCategoryPath = async (categoryId: string, userId: string): Promise<void> => {
  const category = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

  if (!category[0]) return;

  let newPath = `/${category[0].name}`;
  let newLevel = 0;

  if (category[0].parentId) {
    const parent = await db
      .select()
      .from(categories)
      .where(eq(categories.id, category[0].parentId))
      .limit(1);

    if (parent[0]) {
      newPath = `${parent[0].path}/${category[0].name}`;
      newLevel = parent[0].level + 1;
    }
  }

  // Update this category
  await db
    .update(categories)
    .set({
      path: newPath,
      level: newLevel,
      updatedAt: Date.now(),
    })
    .where(eq(categories.id, categoryId));

  // Update all descendant paths
  const descendants = await db
    .select()
    .from(categories)
    .where(like(categories.path, `${category[0].path}/%`));

  for (const descendant of descendants) {
    const relativePath = descendant.path.substring(category[0].path.length);
    const newDescendantPath = newPath + relativePath;
    const newDescendantLevel = newLevel + relativePath.split("/").length - 1;

    await db
      .update(categories)
      .set({
        path: newDescendantPath,
        level: newDescendantLevel,
        updatedAt: Date.now(),
      })
      .where(eq(categories.id, descendant.id));
  }
};

/**
 * Deletes a category and handles children (moves them to parent or deletes them)
 */
export const deleteCategory = async (
  categoryId: string,
  userId: string,
  moveChildrenToParent: boolean = true
): Promise<void> => {
  const category = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);

  if (!category[0]) return;

  const children = await getCategoryChildren(categoryId, userId);

  if (moveChildrenToParent && children.length > 0) {
    // Move children to this category's parent
    await db
      .update(categories)
      .set({
        parentId: category[0].parentId,
        updatedAt: Date.now(),
      })
      .where(eq(categories.parentId, categoryId));

    // Update paths for moved children
    for (const child of children) {
      await updateCategoryPath(child.id, userId);
    }
  }

  // Delete the category (CASCADE will handle mappings and set activity categoryId to NULL)
  await db.delete(categories).where(eq(categories.id, categoryId));
};

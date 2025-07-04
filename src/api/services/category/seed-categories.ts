import { eq } from "drizzle-orm";
import db from "@/api/db";
import { categories } from "@/api/db/schema";
import type { NewCategory, Category } from "@/types/category";

/**
 * Default system categories that should be available to all users
 * Based on the comprehensive categorization system from the SQL migration
 */
const DEFAULT_CATEGORIES = [
  // Root categories
  {
    name: "Work",
    description: "Work-related activities",
    color: "#3b82f6",
    icon: "�",
    order: 0,
    children: [
      {
        name: "Development",
        description: "Software development tools",
        color: "#1e40af",
        icon: "💻",
        order: 0,
      },
      {
        name: "Design",
        description: "Design and creative tools",
        color: "#7c2d12",
        icon: "🎨",
        order: 1,
      },
      {
        name: "Communication",
        description: "Work communication",
        color: "#059669",
        icon: "�",
        order: 2,
      },
      {
        name: "Documentation",
        description: "Writing and documentation",
        color: "#0369a1",
        icon: "📝",
        order: 3,
      },
      {
        name: "Meetings",
        description: "Video calls and meetings",
        color: "#7c3aed",
        icon: "👥",
        order: 4,
      },
    ],
  },
  {
    name: "Personal",
    description: "Personal activities",
    color: "#10b981",
    icon: "🏠",
    order: 1,
  },
  {
    name: "Learning",
    description: "Educational content",
    color: "#8b5cf6",
    icon: "�",
    order: 2,
  },
  {
    name: "Entertainment",
    description: "Entertainment and leisure",
    color: "#f59e0b",
    icon: "🎮",
    order: 3,
  },
  {
    name: "Social",
    description: "Social media and communication",
    color: "#ef4444",
    icon: "💬",
    order: 4,
  },
  {
    name: "Utilities",
    description: "System and utility apps",
    color: "#6b7280",
    icon: "⚙️",
    order: 5,
  },
] as const;

/**
 * Seeds default categories for a new user by copying from system categories
 * @param userId - The user ID to create categories for
 * @returns Promise resolving to the created categories
 */
export const seedUserCategoriesFromSystem = async (userId: string) => {
  console.log(`Seeding default categories for user ${userId}`);

  // Check if user already has categories
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existingCategories.length > 0) {
    console.log(`User ${userId} already has categories, skipping seed`);
    return existingCategories;
  }

  // Create default categories for the user
  const createdCategories: Category[] = [];

  const createCategory = async (
    categoryData: any,
    parentId: string | null = null,
    level = 0
  ): Promise<Category> => {
    const now = Date.now();
    const id = `cat_${Math.random().toString(36).substr(2, 9)}`;
    const pathSegment = categoryData.name;
    const path = parentId
      ? `${createdCategories.find((c) => c.id === parentId)?.path}/${pathSegment}`
      : `/${pathSegment}`;

    const newCategory: NewCategory = {
      id,
      name: categoryData.name,
      description: categoryData.description,
      color: categoryData.color,
      icon: categoryData.icon,
      parentId,
      path,
      level,
      order: categoryData.order,
      userId,
      isSystem: false, // User-specific copies, not system categories
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(categories).values(newCategory);
    const created = newCategory as Category;
    createdCategories.push(created);
    return created;
  };

  // Create root categories first
  for (const categoryData of DEFAULT_CATEGORIES) {
    const parent = await createCategory(categoryData, null, 0);

    // Create children if they exist
    if ("children" in categoryData && categoryData.children) {
      for (const childData of categoryData.children) {
        await createCategory(childData, parent.id, 1);
      }
    }
  }

  console.log(`Created ${createdCategories.length} default categories for user ${userId}`);
  return createdCategories;
};

/**
 * Gets the default categories template (without creating them)
 * @returns The default categories configuration
 */
export const getDefaultCategoriesTemplate = () => {
  return DEFAULT_CATEGORIES;
};

/**
 * Checks if a user has any categories
 * @param userId - The user ID to check
 * @returns Promise resolving to boolean indicating if user has categories
 */
export const userHasCategories = async (userId: string): Promise<boolean> => {
  const userCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  return userCategories.length > 0;
};

/**
 * Resets user categories to default (WARNING: Destructive operation)
 * @param userId - The user ID to reset categories for
 * @returns Promise resolving to the new default categories
 */
export const resetUserCategoriesToDefault = async (userId: string) => {
  console.log(`Resetting categories for user ${userId} to defaults`);

  // Delete existing categories
  await db.delete(categories).where(eq(categories.userId, userId));

  // Seed fresh default categories
  return seedUserCategoriesFromSystem(userId);
};

/**
 * Default category mappings for automatic categorization
 * Based on the comprehensive mapping system from the SQL migration
 */
const DEFAULT_CATEGORY_MAPPINGS = [
  // Development mappings
  {
    categoryName: "Development",
    appName: "Visual Studio Code",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: "WebStorm",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: "Xcode",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: "Android Studio",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: "Terminal",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: "iTerm2",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: null,
    domain: "github.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: null,
    domain: "gitlab.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Development",
    appName: null,
    domain: "stackoverflow.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Design mappings
  {
    categoryName: "Design",
    appName: "Figma",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Design",
    appName: "Adobe Photoshop",
    domain: null,
    titlePattern: null,
    matchType: "contains",
    priority: 100,
  },
  {
    categoryName: "Design",
    appName: "Sketch",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Design",
    appName: "Canva",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Communication mappings
  {
    categoryName: "Communication",
    appName: "Slack",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Communication",
    appName: "Microsoft Teams",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Communication",
    appName: "Discord",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Communication",
    appName: "Mail",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Communication",
    appName: null,
    domain: "gmail.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Documentation mappings
  {
    categoryName: "Documentation",
    appName: "Notion",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Documentation",
    appName: "Obsidian",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Documentation",
    appName: "Microsoft Word",
    domain: null,
    titlePattern: null,
    matchType: "contains",
    priority: 100,
  },
  {
    categoryName: "Documentation",
    appName: "Google Docs",
    domain: null,
    titlePattern: null,
    matchType: "contains",
    priority: 100,
  },
  {
    categoryName: "Documentation",
    appName: null,
    domain: "docs.google.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Meetings mappings
  {
    categoryName: "Meetings",
    appName: "Zoom",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Meetings",
    appName: null,
    domain: "meet.google.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Meetings",
    appName: null,
    domain: "teams.microsoft.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Learning mappings
  {
    categoryName: "Learning",
    appName: null,
    domain: "youtube.com",
    titlePattern: "tutorial|course|learn|how to",
    matchType: "regex",
    priority: 90,
  },
  {
    categoryName: "Learning",
    appName: null,
    domain: "udemy.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Learning",
    appName: null,
    domain: "coursera.org",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Learning",
    appName: null,
    domain: "khanacademy.org",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Learning",
    appName: null,
    domain: "pluralsight.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Entertainment mappings
  {
    categoryName: "Entertainment",
    appName: null,
    domain: "netflix.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Entertainment",
    appName: null,
    domain: "youtube.com",
    titlePattern: null,
    matchType: "exact",
    priority: 80,
  }, // Lower priority than learning
  {
    categoryName: "Entertainment",
    appName: null,
    domain: "twitch.tv",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Entertainment",
    appName: "Steam",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Entertainment",
    appName: "Spotify",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Social mappings
  {
    categoryName: "Social",
    appName: null,
    domain: "twitter.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Social",
    appName: null,
    domain: "x.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Social",
    appName: null,
    domain: "facebook.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Social",
    appName: null,
    domain: "instagram.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Social",
    appName: null,
    domain: "linkedin.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Social",
    appName: null,
    domain: "reddit.com",
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },

  // Utilities mappings
  {
    categoryName: "Utilities",
    appName: "Finder",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Utilities",
    appName: "System Preferences",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Utilities",
    appName: "Activity Monitor",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
  {
    categoryName: "Utilities",
    appName: "Calculator",
    domain: null,
    titlePattern: null,
    matchType: "exact",
    priority: 100,
  },
] as const;

/**
 * Seeds default category mappings for automatic categorization
 * @param userId - The user ID to create mappings for
 * @returns Promise resolving to the created mappings
 */
export const seedDefaultCategoryMappings = async (userId: string) => {
  console.log(`Seeding default category mappings for user ${userId}`);

  // Import here to avoid circular dependency
  const { createCategoryMapping } = await import("./category-matching");
  const { getCategories } = await import("./category-management");

  // Get user's categories
  const userCategories = await getCategories(userId);

  if (userCategories.length === 0) {
    console.log(`User ${userId} has no categories, skipping mapping seed`);
    return [];
  }

  const createdMappings = [];

  for (const mappingData of DEFAULT_CATEGORY_MAPPINGS) {
    // Find the category by name (could be nested)
    const category = userCategories.find(
      (cat) =>
        cat.name === mappingData.categoryName || cat.path.endsWith(`/${mappingData.categoryName}`)
    );

    if (!category) {
      console.warn(`Category ${mappingData.categoryName} not found for user ${userId}`);
      continue;
    }

    try {
      const mapping = await createCategoryMapping({
        categoryId: category.id,
        appName: mappingData.appName,
        domain: mappingData.domain,
        titlePattern: mappingData.titlePattern,
        matchType: mappingData.matchType as any,
        priority: mappingData.priority,
        userId,
        isActive: true,
      });

      createdMappings.push(mapping);
    } catch (error) {
      console.error(`Failed to create mapping for ${mappingData.categoryName}:`, error);
    }
  }

  console.log(`Created ${createdMappings.length} default category mappings for user ${userId}`);
  return createdMappings;
};

/**
 * Seeds both categories and mappings for a new user (complete setup)
 * @param userId - The user ID to setup categories for
 * @returns Promise resolving to an object with created categories and mappings
 */
export const seedCompleteUserCategorization = async (userId: string) => {
  console.log(`Setting up complete categorization system for user ${userId}`);

  // First seed categories
  const categories = await seedUserCategoriesFromSystem(userId);

  // Then seed mappings
  const mappings = await seedDefaultCategoryMappings(userId);

  console.log(
    `Complete setup for user ${userId}: ${categories.length} categories, ${mappings.length} mappings`
  );

  return {
    categories,
    mappings,
  };
};

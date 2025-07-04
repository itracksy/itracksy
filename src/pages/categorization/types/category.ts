import type { categories, categoryMappings } from "@/api/db/schema";
import type {
  Category as DBCategory,
  CategoryTreeNode as DBCategoryTreeNode,
} from "@/types/category";

// Re-export the database types
export type Category = DBCategory;
export type CategoryMapping = typeof categoryMappings.$inferSelect;
export type CategoryTreeNode = DBCategoryTreeNode;

export interface CategoryWithChildren extends Category {
  readonly children: readonly CategoryWithChildren[];
  readonly activityCount?: number;
  readonly totalDuration?: number;
}

export interface CategoryStats {
  readonly totalCategories: number;
  readonly totalMappings: number;
  readonly categorizedActivities: number;
  readonly uncategorizedActivities: number;
  readonly topCategories: readonly {
    readonly categoryName: string;
    readonly activityCount: number;
    readonly totalDuration: number;
  }[];
}

export interface CreateCategoryData {
  readonly name: string;
  readonly color?: string;
  readonly icon?: string;
  readonly description?: string;
  readonly parentId?: string;
}

export interface UpdateCategoryData {
  readonly name?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly description?: string;
  readonly parentId?: string;
}

export type CategoryFormMode = "create" | "edit";

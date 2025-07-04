import type { categories, categoryMappings } from "../api/db/schema";

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryMapping = typeof categoryMappings.$inferSelect;
export type NewCategoryMapping = typeof categoryMappings.$inferInsert;

export interface CategoryWithChildren extends Category {
  readonly children: readonly CategoryWithChildren[];
}

export interface CategoryTreeNode {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly color?: string | null;
  readonly icon?: string | null;
  readonly path: string;
  readonly level: number;
  readonly order: number;
  readonly children: readonly CategoryTreeNode[];
  readonly mappingCount?: number;
  readonly activityCount?: number;
}

export interface CategoryMatchResult {
  readonly categoryId: string;
  readonly confidence: number; // 0-1 confidence score
  readonly matchedBy: "appName" | "domain" | "title";
  readonly mappingId: string;
}

export type MatchType = "exact" | "contains" | "starts_with" | "regex";

export interface CategoryStats {
  readonly totalCategories: number;
  readonly totalMappings: number;
  readonly categorizedActivities: number;
  readonly uncategorizedActivities: number;
  readonly topCategories: readonly {
    readonly categoryId: string;
    readonly categoryName: string;
    readonly activityCount: number;
    readonly totalDuration: number; // in seconds
  }[];
}

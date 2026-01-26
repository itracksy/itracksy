// Category management functions
export {
  createCategory,
  getCategories,
  getRootCategories,
  getCategoryChildren,
  getCategoryTree,
  updateCategory,
  updateCategoryPath,
  deleteCategory,
} from "./category-management";

// Category mapping and matching functions
export {
  createCategoryMapping,
  getCategoryMappings,
  getCategoryMappingsForCategory,
  matchActivityToCategory,
  categorizePendingActivities,
  updateCategoryMapping,
  deleteCategoryMapping,
} from "./category-matching";

// Auto-categorization functions
export {
  categorizeNewActivity,
  getCategoryStats,
  getUncategorizedActivities,
  getCategoryActivitiesDetail,
  bulkAssignCategory,
  getActivitiesGroupedByApp,
  getTopUsageSummary,
} from "./auto-categorize";

// Category seeding functions
export {
  seedUserCategoriesFromSystem,
  getDefaultCategoriesTemplate,
  userHasCategories,
  resetUserCategoriesToDefault,
  seedDefaultCategoryMappings,
  seedCompleteUserCategorization,
} from "./seed-categories";

// System category functions
export {
  copySystemCategoriesToUser,
  hasUserCategories,
  seedUserCategoriesFromSystem as seedFromSystemCategories,
} from "./seed-from-system";

// macOS app metadata functions (Tier 1: Deterministic Layer)
export { getAppMetadata, scanInstalledApps, getAutoCategorizeablApps } from "./app-metadata";

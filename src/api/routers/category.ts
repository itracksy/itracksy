import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { categories, categoryMappings } from "../db/schema";
import {
  createCategory,
  getCategories,
  getRootCategories,
  getCategoryChildren,
  getCategoryTree,
  updateCategory,
  updateCategoryPath,
  deleteCategory,
  createCategoryMapping,
  getCategoryMappings,
  getCategoryMappingsForCategory,
  matchActivityToCategory,
  categorizePendingActivities,
  updateCategoryMapping,
  deleteCategoryMapping,
  categorizeNewActivity,
  getCategoryStats,
  getUncategorizedActivities,
  bulkAssignCategory,
  seedUserCategoriesFromSystem,
  getDefaultCategoriesTemplate,
  userHasCategories,
  resetUserCategoriesToDefault,
  seedDefaultCategoryMappings,
  seedCompleteUserCategorization,
  copySystemCategoriesToUser,
  hasUserCategories,
  seedFromSystemCategories,
} from "../services/category";

// Create Zod schemas from Drizzle tables
const categoryInsertSchema = createInsertSchema(categories);
const categorySelectSchema = createSelectSchema(categories);
const categoryMappingInsertSchema = createInsertSchema(categoryMappings);
const categoryMappingSelectSchema = createSelectSchema(categoryMappings);

export const categoryRouter = t.router({
  // Category Management
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getCategories(ctx.userId!);
  }),

  getRoots: protectedProcedure.query(async ({ ctx }) => {
    return getRootCategories(ctx.userId!);
  }),

  getChildren: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return getCategoryChildren(input, ctx.userId!);
  }),

  getTree: protectedProcedure.query(async ({ ctx }) => {
    return getCategoryTree(ctx.userId!);
  }),

  create: protectedProcedure
    .input(
      categoryInsertSchema.omit({
        id: true,
        path: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createCategory({
        ...input,
        userId: ctx.userId!,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updates: categoryInsertSchema.partial().omit({
          id: true,
          path: true,
          level: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return updateCategory(input.id, input.updates, ctx.userId!);
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        moveChildrenToParent: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return deleteCategory(input.id, ctx.userId!, input.moveChildrenToParent);
    }),

  // Category Mappings
  getMappings: protectedProcedure.query(async ({ ctx }) => {
    return getCategoryMappings(ctx.userId!);
  }),

  getMappingsForCategory: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return getCategoryMappingsForCategory(input, ctx.userId!);
  }),

  createMapping: protectedProcedure
    .input(
      categoryMappingInsertSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createCategoryMapping({
        ...input,
        userId: ctx.userId!,
      });
    }),

  updateMapping: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updates: categoryMappingInsertSchema.partial().omit({
          id: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return updateCategoryMapping(input.id, input.updates, ctx.userId!);
    }),

  deleteMapping: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    return deleteCategoryMapping(input, ctx.userId!);
  }),

  // Activity Matching and Auto-categorization
  matchActivity: protectedProcedure
    .input(
      z.object({
        ownerName: z.string(),
        url: z.string().nullable().optional(),
        title: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return matchActivityToCategory(input, ctx.userId!);
    }),

  categorizePending: protectedProcedure.mutation(async ({ ctx }) => {
    return categorizePendingActivities(ctx.userId!);
  }),

  categorizeActivity: protectedProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
    return categorizeNewActivity(input, ctx.userId!);
  }),

  bulkAssignCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        ownerName: z.string(),
        domain: z.string().nullable().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return bulkAssignCategory(ctx.userId!, input.categoryId, {
        ownerName: input.ownerName,
        domain: input.domain,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  // Statistics
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return getCategoryStats(ctx.userId!, input.startDate, input.endDate);
    }),

  getUncategorizedActivities: protectedProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      return getUncategorizedActivities(ctx.userId!, input.startDate, input.endDate, input.limit);
    }),

  // Category Seeding
  seedDefaultCategories: protectedProcedure.mutation(async ({ ctx }) => {
    return seedUserCategoriesFromSystem(ctx.userId!);
  }),

  getDefaultTemplate: protectedProcedure.query(async () => {
    return getDefaultCategoriesTemplate();
  }),

  hasCategories: protectedProcedure.query(async ({ ctx }) => {
    return userHasCategories(ctx.userId!);
  }),

  resetToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    return resetUserCategoriesToDefault(ctx.userId!);
  }),

  seedCategoryMappings: protectedProcedure.mutation(async ({ ctx }) => {
    return seedDefaultCategoryMappings(ctx.userId!);
  }),

  seedCompleteSetup: protectedProcedure.mutation(async ({ ctx }) => {
    return seedCompleteUserCategorization(ctx.userId!);
  }),

  importFromSystem: protectedProcedure.mutation(async ({ ctx }) => {
    return seedFromSystemCategories(ctx.userId!);
  }),

  copySystemCategories: protectedProcedure.mutation(async ({ ctx }) => {
    return copySystemCategoriesToUser(ctx.userId!);
  }),
});

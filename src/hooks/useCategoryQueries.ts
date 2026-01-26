import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "./use-toast";

// Category Management Queries
export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => trpcClient.category.getTree.query(),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => trpcClient.category.getAll.query(),
  });
}

function useRootCategories() {
  return useQuery({
    queryKey: ["categories", "roots"],
    queryFn: () => trpcClient.category.getRoots.query(),
  });
}

function useCategoryChildren(categoryId: string) {
  return useQuery({
    queryKey: ["categories", "children", categoryId],
    queryFn: () => trpcClient.category.getChildren.query(categoryId),
    enabled: !!categoryId,
  });
}

// Category Mapping Queries
function useCategoryMappings() {
  return useQuery({
    queryKey: ["categoryMappings"],
    queryFn: () => trpcClient.category.getMappings.query(),
  });
}

export function useCategoryMappingsForCategory(categoryId: string) {
  return useQuery({
    queryKey: ["categoryMappings", "category", categoryId],
    queryFn: () => trpcClient.category.getMappingsForCategory.query(categoryId),
    enabled: !!categoryId,
  });
}

// Category Statistics
export function useCategoryStats(startDate?: number, endDate?: number) {
  return useQuery({
    queryKey: ["categories", "stats", startDate, endDate],
    queryFn: () => trpcClient.category.getStats.query({ startDate, endDate }),
  });
}

// Uncategorized Activities
export function useUncategorizedActivities(
  startDate?: number,
  endDate?: number,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["categories", "uncategorized", startDate, endDate, limit],
    queryFn: () =>
      trpcClient.category.getUncategorizedActivities.query({ startDate, endDate, limit }),
  });
}

// Category Activities with Detail (includes session type)
export function useCategoryActivitiesDetail(
  startDate?: number,
  endDate?: number,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["categories", "activitiesDetail", startDate, endDate, limit],
    queryFn: () =>
      trpcClient.category.getCategoryActivitiesDetail.query({ startDate, endDate, limit }),
  });
}

// Activities grouped by app (for App/Domain view)
export function useActivitiesGroupedByApp(startDate?: number, endDate?: number) {
  return useQuery({
    queryKey: ["categories", "groupedByApp", startDate, endDate],
    queryFn: () => trpcClient.category.getActivitiesGroupedByApp.query({ startDate, endDate }),
  });
}

// Top usage summary (apps and domains)
export function useTopUsageSummary(startDate?: number, endDate?: number, limit: number = 5) {
  return useQuery({
    queryKey: ["categories", "topUsage", startDate, endDate, limit],
    queryFn: () => trpcClient.category.getTopUsageSummary.query({ startDate, endDate, limit }),
  });
}

// Category Management Mutations
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.create.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.update.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.delete.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    },
  });
}

// Category Mapping Mutations
export function useCreateCategoryMappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.createMapping.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: "Category mapping created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create mapping",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategoryMappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.updateMapping.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: "Category mapping updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update mapping",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategoryMappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.deleteMapping.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: "Category mapping deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete mapping",
        variant: "destructive",
      });
    },
  });
}

// Auto-categorization Mutations
function useMatchActivityMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.matchActivity.mutate,
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to match activity",
        variant: "destructive",
      });
    },
  });
}

function useCategorizePendingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.categorizePending.mutate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({
        title: "Success",
        description: `Categorized ${data.categorized} out of ${data.total} activities`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to categorize activities",
        variant: "destructive",
      });
    },
  });
}

function useCategorizeActivityMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.categorizeActivity.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to categorize activity",
        variant: "destructive",
      });
    },
  });
}

export function useBulkAssignCategoryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.bulkAssignCategory.mutate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", "uncategorized"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: `Assigned category to ${data.assignedCount} activities and created a new mapping rule.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign category",
        variant: "destructive",
      });
    },
  });
}

// Category Seeding Queries and Mutations
function useDefaultCategoriesTemplate() {
  return useQuery({
    queryKey: ["categories", "template"],
    queryFn: () => trpcClient.category.getDefaultTemplate.query(),
  });
}

export function useHasCategories() {
  return useQuery({
    queryKey: ["categories", "hasCategories"],
    queryFn: () => trpcClient.category.hasCategories.query(),
  });
}

function useSeedDefaultCategoriesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.seedDefaultCategories.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Default categories have been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed categories",
        variant: "destructive",
      });
    },
  });
}

function useResetCategoriesToDefaultMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.resetToDefaults.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Categories have been reset to defaults",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset categories",
        variant: "destructive",
      });
    },
  });
}

function useSeedCategoryMappingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.seedCategoryMappings.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: "Default category mappings have been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed category mappings",
        variant: "destructive",
      });
    },
  });
}

export function useSeedCompleteSetupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.seedCompleteSetup.mutate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: "Complete categorization system has been set up with categories and mappings",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to setup complete categorization system",
        variant: "destructive",
      });
    },
  });
}

function useImportFromSystemMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.importFromSystem.mutate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: `Imported ${result.categoriesCreated} categories and ${result.mappingsCreated} mappings from system`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import system categories",
        variant: "destructive",
      });
    },
  });
}

function useCopySystemCategoriesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.copySystemCategories.mutate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      toast({
        title: "Success",
        description: `Copied ${result.categoriesCreated} categories and ${result.mappingsCreated} mappings from system`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy system categories",
        variant: "destructive",
      });
    },
  });
}

// ============================================
// macOS App Metadata Hooks (Smart Auto-Categorization)
// ============================================

/**
 * Scan all installed macOS apps and get their metadata
 * This includes LSApplicationCategoryType from Info.plist
 */
function useScanInstalledApps() {
  return useQuery({
    queryKey: ["apps", "installed"],
    queryFn: () => trpcClient.category.scanInstalledApps.query(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Get apps that can be auto-categorized with suggestions
 * Filtered to only include apps with high-confidence suggestions
 */
export function useAppSuggestions() {
  return useQuery({
    queryKey: ["apps", "suggestions"],
    queryFn: () => trpcClient.category.getAppSuggestions.query(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Get metadata for a specific app
 */
export function useAppMetadata(bundleId: string, appName?: string) {
  return useQuery({
    queryKey: ["apps", "metadata", bundleId],
    queryFn: () => trpcClient.category.getAppMetadata.query({ bundleId, appName }),
    enabled: !!bundleId,
  });
}

/**
 * Auto-create category mappings from macOS app metadata
 */
export function useAutoCreateMappingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.category.autoCreateMappingsFromMetadata.mutate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryMappings"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "uncategorized"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "stats"] });
      toast({
        title: "Auto-Categorization Complete",
        description: `Created ${result.created} new rules${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category mappings",
        variant: "destructive",
      });
    },
  });
}

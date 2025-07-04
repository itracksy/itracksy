import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  FolderTree,
} from "lucide-react";
import { CategoryTreeView } from "./CategoryTreeView";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryMappingManager } from "./CategoryMappingManager";
import {
  useCategoryTree,
  useCategories,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useHasCategories,
  useImportFromSystemMutation,
  useCopySystemCategoriesMutation,
  useResetCategoriesToDefaultMutation,
  useSeedCompleteSetupMutation,
} from "@/hooks/useCategoryQueries";
import type { CategoryFormMode } from "../types";

export const CategoryManagement: React.FC = () => {
  // Direct trpc hooks - no unnecessary wrapper
  const categoryTreeQuery = useCategoryTree();
  const categoriesQuery = useCategories();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  // Import and manage mutations
  const importFromSystemMutation = useImportFromSystemMutation();
  const copySystemMutation = useCopySystemCategoriesMutation();
  const resetToDefaultMutation = useResetCategoriesToDefaultMutation();
  const seedCompleteSetupMutation = useSeedCompleteSetupMutation();
  const { data: hasCategories } = useHasCategories();
  const categories = categoriesQuery.data || [];
  const categoryTree = categoryTreeQuery.data || [];
  const isLoading = categoryTreeQuery.isLoading || categoriesQuery.isLoading;
  const error = categoryTreeQuery.error?.message || categoriesQuery.error?.message || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<CategoryFormMode>("create");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [mappingManagerOpen, setMappingManagerOpen] = useState(false);
  const [selectedCategoryForMappings, setSelectedCategoryForMappings] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleAddCategory = (parentId?: string) => {
    setFormMode("create");
    setSelectedParentId(parentId || null);
    setSelectedCategoryId(null);
    setIsFormModalOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    setFormMode("edit");
    setSelectedCategoryId(categoryId);
    setSelectedParentId(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleManageMappings = (categoryId: string, categoryName: string) => {
    setSelectedCategoryForMappings({ id: categoryId, name: categoryName });
    setMappingManagerOpen(true);
  };

  const handleCloseMappingManager = () => {
    setMappingManagerOpen(false);
    setSelectedCategoryForMappings(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        id: categoryToDelete,
        moveChildrenToParent: true,
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setIsFormSubmitting(true);
    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          ...data,
          color: data.color || "#3b82f6",
          isSystem: false,
          order: 0,
        });
      } else if (selectedCategoryId) {
        await updateMutation.mutateAsync({
          id: selectedCategoryId,
          updates: data,
        });
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedCategoryId(null);
    setSelectedParentId(null);
  };

  const selectedCategory = selectedCategoryId
    ? categories.find((cat: any) => cat.id === selectedCategoryId)
    : undefined;

  const filteredTree = searchQuery
    ? categoryTree.filter(
        (node: any) =>
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categoryTree;

  const handleImportFromSystem = () => {
    setImportDialogOpen(true);
  };

  const handleResetToDefaults = () => {
    setResetDialogOpen(true);
  };

  const confirmImportFromSystem = async () => {
    try {
      await importFromSystemMutation.mutateAsync();
      setImportDialogOpen(false);
    } catch (error) {
      console.error("Failed to import from system:", error);
    }
  };

  const confirmResetToDefaults = async () => {
    try {
      await resetToDefaultMutation.mutateAsync();
      setResetDialogOpen(false);
    } catch (error) {
      console.error("Failed to reset to defaults:", error);
    }
  };

  const handleSeedCompleteSetup = async () => {
    try {
      await seedCompleteSetupMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to seed complete setup:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Error loading categories: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground">
            Organize your activities with a hierarchical category system
          </p>
        </div>
        <Button onClick={() => handleAddCategory()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Import & Reset Section */}
      {(!hasCategories || categories.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Get Started</span>
            </CardTitle>
            <CardDescription>
              No categories found. Import from system defaults or create your own categorization
              system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleSeedCompleteSetup}
                disabled={seedCompleteSetupMutation.isPending}
                className="flex-1"
              >
                {seedCompleteSetupMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Setup Complete System
              </Button>
              <Button
                variant="outline"
                onClick={handleImportFromSystem}
                disabled={importFromSystemMutation.isPending}
                className="flex-1"
              >
                {importFromSystemMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import from System
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              {" "}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportFromSystem}
              disabled={importFromSystemMutation.isPending}
            >
              {importFromSystemMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              disabled={resetToDefaultMutation.isPending}
            >
              {resetToDefaultMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Reset
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
          <CardDescription>
            Manage your category hierarchy. Drag and drop to reorganize, or use the context menu for
            more options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryTreeView
            nodes={filteredTree}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onManageMappings={handleManageMappings}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        mode={formMode}
        category={selectedCategory}
        parentCategories={categories}
        selectedParentId={selectedParentId ?? undefined}
        isLoading={isFormSubmitting || createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Any child categories will be moved to
              the parent level, and activities in this category will become uncategorized. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Categories from System</AlertDialogTitle>
            <AlertDialogDescription>
              This will import categories from the system, potentially overwriting existing
              categories. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmImportFromSystem}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Categories to Default</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your categories to the default system categories, removing any custom
              categories. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetToDefaults}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Mapping Manager */}
      {selectedCategoryForMappings && (
        <CategoryMappingManager
          categoryId={selectedCategoryForMappings.id}
          categoryName={selectedCategoryForMappings.name}
          isOpen={mappingManagerOpen}
          onClose={handleCloseMappingManager}
        />
      )}
    </div>
  );
};

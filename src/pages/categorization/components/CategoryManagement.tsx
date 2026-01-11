import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, AlertTriangle, Sparkles } from "lucide-react";
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
  useSeedCompleteSetupMutation,
} from "@/hooks/useCategoryQueries";
import type { CategoryFormMode } from "../types";

export const CategoryManagement: React.FC = () => {
  const categoryTreeQuery = useCategoryTree();
  const categoriesQuery = useCategories();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const seedCompleteSetupMutation = useSeedCompleteSetupMutation();
  const { data: hasCategories } = useHasCategories();

  const categories = categoriesQuery.data || [];
  const categoryTree = categoryTreeQuery.data || [];
  const isLoading = categoryTreeQuery.isLoading || categoriesQuery.isLoading;
  const error = categoryTreeQuery.error?.message || categoriesQuery.error?.message || null;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<CategoryFormMode>("create");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
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
          <p className="text-muted-foreground">Organize your activities into categories</p>
        </div>
        <Button onClick={() => handleAddCategory()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Get Started - Only show if no categories */}
      {(!hasCategories || categories.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No categories yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Get started with our default categories or create your own
            </p>
            <Button
              onClick={handleSeedCompleteSetup}
              disabled={seedCompleteSetupMutation.isPending}
            >
              {seedCompleteSetupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Setup Default Categories
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Category Tree */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Click on a category to expand, or use the menu for more options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryTreeView
              nodes={categoryTree}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onManageMappings={handleManageMappings}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

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
              the parent level, and activities in this category will become uncategorized.
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

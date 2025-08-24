import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Tag, Folder } from "lucide-react";
import {
  useCategories,
  useCreateCategoryMutation,
  useBulkAssignCategoryMutation,
} from "@/hooks/useCategoryQueries";
import { CategoryFormModal } from "./CategoryFormModal";
import type { CreateCategoryData, UpdateCategoryData } from "../types";

interface AssignCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityGroup: {
    ownerName: string;
    domain: string | null;
    sampleTitles: readonly string[];
    activityCount: number;
  };
}

export const AssignCategoryModal: React.FC<AssignCategoryModalProps> = ({
  open,
  onOpenChange,
  activityGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createCategoryMutation = useCreateCategoryMutation();
  const bulkAssignMutation = useBulkAssignCategoryMutation();

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignExistingCategory = async (categoryId: string) => {
    try {
      await bulkAssignMutation.mutateAsync({
        categoryId,
        ownerName: activityGroup.ownerName,
        domain: activityGroup.domain,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to assign category:", error);
    }
  };

  const handleCreateAndAssignCategory = async (data: CreateCategoryData | UpdateCategoryData) => {
    try {
      const newCategory = await createCategoryMutation.mutateAsync({
        ...(data as CreateCategoryData),
        isSystem: false,
        order: 0,
      });

      // After creating, assign it to the activities
      if (newCategory) {
        await handleAssignExistingCategory(newCategory.id);
      }
    } catch (error) {
      console.error("Failed to create and assign category:", error);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Assign Category
            </DialogTitle>
            <DialogDescription>
              Assign a category to {activityGroup.activityCount} activities from{" "}
              <span className="font-medium">{activityGroup.ownerName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sample titles */}
            {activityGroup.sampleTitles.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Activity Examples:</p>
                <div className="flex flex-wrap gap-1">
                  {activityGroup.sampleTitles.slice(0, 3).map((title, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {title}
                    </Badge>
                  ))}
                  {activityGroup.sampleTitles.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activityGroup.sampleTitles.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <>
              {/* Search existing categories */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search existing categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Existing categories list */}
                <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-sm text-muted-foreground">Loading categories...</p>
                    </div>
                  ) : filteredCategories.length > 0 ? (
                    <div className="space-y-2">
                      {filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color || "#3b82f6" }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAssignExistingCategory(category.id)}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? "No categories match your search" : "No categories found"}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Create new category option */}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Don't see a suitable category?
                  </span>
                </div>
                <Button variant="outline" onClick={() => setIsFormModalOpen(true)}>
                  Create New Category
                </Button>
              </div>
            </>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateAndAssignCategory}
        mode="create"
        parentCategories={categories}
        isLoading={createCategoryMutation.isPending}
        initialData={{
          name: activityGroup.ownerName,
          description: `Category for ${activityGroup.ownerName} activities`,
        }}
      />
    </>
  );
};

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Edit,
  Trash,
  Globe,
  Monitor,
  Hash,
  Loader2,
  Target,
} from "lucide-react";
import {
  useCategoryMappingsForCategory,
  useDeleteCategoryMappingMutation,
} from "@/hooks/useCategoryQueries";
import { CategoryMappingFormModal } from "./CategoryMappingFormModal";
import type { CategoryMapping } from "../types";

interface CategoryMappingManagerProps {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const CategoryMappingManager: React.FC<CategoryMappingManagerProps> = ({
  categoryId,
  categoryName,
  isOpen,
  onClose,
}) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CategoryMapping | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);

  // Data fetching
  const { data: mappings = [], isLoading } = useCategoryMappingsForCategory(categoryId);
  const deleteMutation = useDeleteCategoryMappingMutation();

  const handleAddMapping = () => {
    setEditingMapping(null);
    setIsFormModalOpen(true);
  };

  const handleEditMapping = (mapping: CategoryMapping) => {
    setEditingMapping(mapping);
    setIsFormModalOpen(true);
  };

  const handleDeleteMapping = (mappingId: string) => {
    setMappingToDelete(mappingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!mappingToDelete) return;

    try {
      await deleteMutation.mutateAsync(mappingToDelete);
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    } catch (error) {
      console.error("Failed to delete mapping:", error);
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return <Target className="h-3 w-3" />;
      case "contains":
        return <Hash className="h-3 w-3" />;
      case "starts_with":
        return <span className="font-mono text-xs">^</span>;
      case "regex":
        return <span className="font-mono text-xs">.*</span>;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "exact":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "contains":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "starts_with":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "regex":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getMappingSource = (mapping: CategoryMapping) => {
    if (mapping.appName) return { type: "app", value: mapping.appName, icon: Monitor };
    if (mapping.domain) return { type: "domain", value: mapping.domain, icon: Globe };
    if (mapping.titlePattern) return { type: "title", value: mapping.titlePattern, icon: Hash };
    return { type: "unknown", value: "Unknown", icon: Target };
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Category Mappings: {categoryName}
            </DialogTitle>
            <DialogDescription>
              Rules that determine when activities are automatically categorized into this category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {mappings.length} mapping{mappings.length !== 1 ? "s" : ""} configured
              </div>
              <Button onClick={handleAddMapping} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Loading mappings...
              </div>
            ) : mappings.length === 0 ? (
              <div className="py-8 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No mappings configured</h3>
                <p className="mb-4 text-muted-foreground">
                  Add mapping rules to automatically categorize activities into this category.
                </p>
                <Button onClick={handleAddMapping}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Mapping
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Match Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping) => {
                      const source = getMappingSource(mapping);
                      const SourceIcon = source.icon;

                      return (
                        <TableRow key={mapping.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <SourceIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{source.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-sm">
                              {source.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getMatchTypeColor(mapping.matchType)}
                            >
                              <span className="flex items-center gap-1">
                                {getMatchTypeIcon(mapping.matchType)}
                                {mapping.matchType}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{mapping.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={mapping.isActive ? "default" : "secondary"}
                              className={
                                mapping.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              }
                            >
                              {mapping.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditMapping(mapping)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMapping(mapping.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Mapping Modal */}
      <CategoryMappingFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingMapping(null);
        }}
        categoryId={categoryId}
        categoryName={categoryName}
        mapping={editingMapping}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mapping? This action cannot be undone and may
              affect how activities are automatically categorized.
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
    </>
  );
};

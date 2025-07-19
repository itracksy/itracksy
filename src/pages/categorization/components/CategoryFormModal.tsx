import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Category, CreateCategoryData, UpdateCategoryData, CategoryFormMode } from "../types";

interface CategoryFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>;
  readonly mode: CategoryFormMode;
  readonly category?: Category;
  readonly parentCategories: readonly Category[];
  readonly selectedParentId?: string;
  readonly isLoading?: boolean;
  readonly initialData?: {
    readonly name?: string;
    readonly description?: string;
  };
}

const CATEGORY_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280", // Gray
] as const;

const CATEGORY_ICONS = [
  "💼",
  "📊",
  "🎯",
  "📝",
  "💻",
  "📞",
  "✉️",
  "📅",
  "🔧",
  "🎨",
  "📚",
  "🏠",
  "🚗",
  "🍕",
  "🏃",
  "🎵",
  "🎮",
  "📺",
  "🛒",
  "💰",
] as const;

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  category,
  parentCategories,
  selectedParentId,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: CATEGORY_COLORS[0] as string,
    icon: "",
    parentId: "none",
  });

  // Initialize form data when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        setFormData({
          name: category.name,
          description: category.description || "",
          color: category.color || (CATEGORY_COLORS[0] as string),
          icon: category.icon || "",
          parentId: category.parentId || "none",
        });
      } else {
        setFormData({
          name: initialData?.name || "",
          description: initialData?.description || "",
          color: CATEGORY_COLORS[0] as string,
          icon: "",
          parentId: selectedParentId || "none",
        });
      }
    }
  }, [isOpen, mode, category, selectedParentId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
      icon: formData.icon || undefined,
      parentId: formData.parentId === "none" ? undefined : formData.parentId,
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      color: CATEGORY_COLORS[0] as string,
      icon: "",
      parentId: "none",
    });
    onClose();
  };

  const title = mode === "create" ? "Create Category" : "Edit Category";
  const submitText = mode === "create" ? "Create" : "Update";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new category to organize your activities."
              : "Edit the category details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Category name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, parentId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (root category)</SelectItem>
                {parentCategories
                  .filter((cat) => (mode === "edit" ? cat.id !== category?.id : true))
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color || "#3b82f6" }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "scale-110 border-gray-900"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-md border-2 text-lg transition-all ${
                    formData.icon === icon
                      ? "border-gray-900 bg-gray-100"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      icon: prev.icon === icon ? "" : icon,
                    }))
                  }
                >
                  {icon}
                </button>
              ))}
            </div>
            {formData.icon && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <Badge variant="outline" className="px-2 py-1 text-lg">
                  {formData.icon}
                </Badge>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isLoading}>
              {isLoading ? "Saving..." : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

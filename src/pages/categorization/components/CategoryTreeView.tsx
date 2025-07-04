import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategoryMappingsForCategory } from "@/hooks/useCategoryQueries";
import type { CategoryTreeNode } from "../types";

interface CategoryTreeItemProps {
  readonly node: CategoryTreeNode;
  readonly level: number;
  readonly onAddChild: (parentId: string) => void;
  readonly onEdit: (categoryId: string) => void;
  readonly onDelete: (categoryId: string) => void;
  readonly onManageMappings: (categoryId: string, categoryName: string) => void;
  readonly isExpanded: boolean;
  readonly onToggleExpand: (categoryId: string) => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  node,
  level,
  onAddChild,
  onEdit,
  onDelete,
  onManageMappings,
  isExpanded,
  onToggleExpand,
}) => {
  const hasChildren = node.children.length > 0;
  const indentSize = level * 20;

  // Get mapping count for this category
  const { data: mappings = [] } = useCategoryMappingsForCategory(node.id);
  const mappingCount = mappings.length;

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/50",
          "border border-transparent hover:border-border"
        )}
        style={{ paddingLeft: `${12 + indentSize}px` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={handleToggle}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        {/* Category Icon */}
        <div
          className="flex h-5 w-5 items-center justify-center rounded text-xs font-medium text-white"
          style={{ backgroundColor: node.color || "#3b82f6" }}
        >
          {node.icon ? <span>{node.icon}</span> : <div className="h-2 w-2 rounded-full bg-white" />}
        </div>

        {/* Category Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">{node.name}</span>
            {node.activityCount && node.activityCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.activityCount}
              </Badge>
            )}
            {mappingCount > 0 && (
              <Badge variant="outline" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                {mappingCount} rule{mappingCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {node.description && (
            <p className="truncate text-sm text-muted-foreground">{node.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(node.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageMappings(node.id, node.name)}>
                <Target className="mr-2 h-4 w-4" />
                Manage Rules ({mappingCount})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(node.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageMappings={onManageMappings}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryTreeViewProps {
  readonly nodes: readonly CategoryTreeNode[];
  readonly onAddCategory: (parentId?: string) => void;
  readonly onEditCategory: (categoryId: string) => void;
  readonly onDeleteCategory: (categoryId: string) => void;
  readonly onManageMappings: (categoryId: string, categoryName: string) => void;
  readonly isLoading?: boolean;
}

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  nodes,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onManageMappings,
  isLoading = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddChild = (parentId: string) => {
    onAddCategory(parentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="py-8 text-center">
        <FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="mb-4 text-muted-foreground">No categories yet</p>
        <Button onClick={() => onAddCategory()}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Category
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <CategoryTreeItem
          key={node.id}
          node={node}
          level={0}
          onAddChild={handleAddChild}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
          onManageMappings={onManageMappings}
          isExpanded={expandedNodes.has(node.id)}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </div>
  );
};

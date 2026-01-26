/**
 * AppDomainView - Flat view of activities grouped by app or domain
 * Browser activities are grouped by domain directly (not nested under browser)
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Monitor, FolderOpen, Tag } from "lucide-react";

interface AppGroup {
  readonly ownerName: string;
  readonly isBrowser: boolean;
  readonly totalDuration: number;
  readonly activityCount: number;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly categoryColor: string | null;
  readonly domains: readonly {
    readonly domain: string;
    readonly duration: number;
    readonly activityCount: number;
    readonly categoryId: string | null;
    readonly categoryName: string | null;
    readonly categoryColor: string | null;
  }[];
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  parentId?: string | null;
}

interface AppDomainViewProps {
  apps: readonly AppGroup[];
  categories: Category[];
  formatDuration: (seconds: number) => string;
  onAssign: (ownerName: string, domain: string | null, categoryId: string) => void;
  isLoading?: boolean;
  isAssigning?: boolean;
}

export const AppDomainView: React.FC<AppDomainViewProps> = ({
  apps,
  categories,
  formatDuration,
  onAssign,
  isLoading,
  isAssigning,
}) => {
  // Filter to root categories only
  const rootCategories = categories.filter((c) => !c.parentId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No activity data for this time period</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div
          key={app.ownerName}
          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {app.isBrowser ? (
              <Globe className="h-4 w-4 text-blue-500" />
            ) : (
              <Monitor className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="text-left">
              <span className="font-medium">{app.ownerName}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {app.activityCount} activities
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{formatDuration(app.totalDuration)}</span>
            {app.categoryName ? (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: app.categoryColor ? `${app.categoryColor}20` : undefined,
                  color: app.categoryColor || undefined,
                }}
              >
                {app.categoryName}
              </Badge>
            ) : (
              <AssignDropdown
                categories={rootCategories}
                onAssign={(categoryId) =>
                  onAssign(app.ownerName, app.isBrowser ? app.ownerName : null, categoryId)
                }
                isAssigning={isAssigning}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * AssignDropdown - Small dropdown for assigning categories
 */
interface AssignDropdownProps {
  categories: Category[];
  onAssign: (categoryId: string) => void;
  isAssigning?: boolean;
  size?: "sm" | "default";
}

function AssignDropdown({
  categories,
  onAssign,
  isAssigning,
  size = "default",
}: AssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : "default"}
        className={size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2 text-xs"}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isAssigning}
      >
        <Tag className={size === "sm" ? "mr-1 h-3 w-3" : "mr-1 h-3 w-3"} />
        Assign
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg">
            <p className="px-2 py-1 text-xs text-muted-foreground">Assign to category:</p>
            {categories.slice(0, 10).map((category) => (
              <button
                key={category.id}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(category.id);
                  setIsOpen(false);
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color || "#666" }}
                />
                {category.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

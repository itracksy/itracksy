import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Monitor,
  Globe,
  Target,
  Coffee,
  Clock,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryActivitiesDetail } from "@/hooks/useCategoryQueries";

interface CategoryActivitiesCardProps {
  startDate?: number;
  endDate?: number;
}

export const CategoryActivitiesCard: React.FC<CategoryActivitiesCardProps> = ({
  startDate,
  endDate,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { data: categoryDetails, isLoading } = useCategoryActivitiesDetail(startDate, endDate, 10);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="mr-2 h-5 w-5" />
            Categories & Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!categoryDetails || categoryDetails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="mr-2 h-5 w-5" />
            Categories & Activities
          </CardTitle>
          <CardDescription>See what you did in each category with session types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-2 h-10 w-10 opacity-50" />
            <p>No categorized activities yet</p>
            <p className="mt-1 text-sm">Start tracking to see your activities here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderOpen className="mr-2 h-5 w-5" />
          Categories & Activities
        </CardTitle>
        <CardDescription>
          Click a category to see what you did and during which session type
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {categoryDetails.map((category) => {
            const isExpanded = expandedCategories.has(category.categoryId);

            // Group activities by app/domain for cleaner display
            const groupedActivities = groupActivitiesBySource(category.activities);

            return (
              <div key={category.categoryId}>
                {/* Category Header */}
                <div
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50"
                  onClick={() => toggleCategory(category.categoryId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.categoryColor || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">{category.categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.activityCount} activities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(category.totalDuration)}</p>
                    <div className="flex items-center gap-1">
                      {hasFocusActivities(category.activities) && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                        >
                          <Target className="mr-1 h-3 w-3" />
                          Focus
                        </Badge>
                      )}
                      {hasBreakActivities(category.activities) && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
                        >
                          <Coffee className="mr-1 h-3 w-3" />
                          Break
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Activities */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <div className="space-y-2">
                      {groupedActivities.map((group, index) => (
                        <div
                          key={`${group.source}-${index}`}
                          className="flex items-center gap-3 rounded-lg bg-background p-3"
                        >
                          <div
                            className={cn(
                              "rounded-lg p-2",
                              group.type === "domain"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            )}
                          >
                            {group.type === "domain" ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <Monitor className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{group.source}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {group.sampleTitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <div>
                              <p className="text-sm font-medium">
                                {formatDuration(group.duration)}
                              </p>
                              <p className="text-xs text-muted-foreground">{group.count} times</p>
                            </div>
                            {group.isFocusMode ? (
                              <Badge
                                variant="outline"
                                className="h-6 border-blue-200 bg-blue-50 px-1.5 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                              >
                                <Target className="h-3 w-3" />
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="h-6 border-green-200 bg-green-50 px-1.5 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400"
                              >
                                <Coffee className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
function hasFocusActivities(activities: readonly { isFocusMode: boolean }[]): boolean {
  return activities.some((a) => a.isFocusMode);
}

function hasBreakActivities(activities: readonly { isFocusMode: boolean }[]): boolean {
  return activities.some((a) => !a.isFocusMode);
}

interface GroupedActivity {
  source: string;
  type: "app" | "domain";
  duration: number;
  count: number;
  sampleTitle: string;
  isFocusMode: boolean;
}

function groupActivitiesBySource(
  activities: readonly {
    ownerName: string;
    domain: string | null;
    title: string;
    duration: number;
    isFocusMode: boolean;
  }[]
): GroupedActivity[] {
  const groups = new Map<string, GroupedActivity>();

  for (const activity of activities) {
    const source = activity.domain || activity.ownerName;
    const key = `${source}-${activity.isFocusMode}`;

    if (!groups.has(key)) {
      groups.set(key, {
        source,
        type: activity.domain ? "domain" : "app",
        duration: 0,
        count: 0,
        sampleTitle: activity.title,
        isFocusMode: activity.isFocusMode,
      });
    }

    const group = groups.get(key)!;
    group.duration += activity.duration;
    group.count++;
  }

  // Filter out activities with less than 60 seconds (would show as "0m")
  return Array.from(groups.values())
    .filter((group) => group.duration >= 60)
    .sort((a, b) => b.duration - a.duration);
}

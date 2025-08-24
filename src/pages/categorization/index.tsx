import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";
import {
  Tags,
  Plus,
  BarChart3,
  Settings,
  Target,
  TrendingUp,
  FolderOpen,
  Activity,
  Loader2,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  useCategoryStats,
  useUncategorizedActivities,
  useCreateCategoryMutation,
  useCategories,
} from "@/hooks/useCategoryQueries";
import { CategoryFormModal } from "./components/CategoryFormModal";
import { AssignCategoryModal } from "./components/AssignCategoryModal";

const CategorizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedClassificationTimeRangeAtom);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedActivityGroup, setSelectedActivityGroup] = useState<{
    ownerName: string;
    domain: string | null;
    sampleTitles: readonly string[];
    activityCount: number;
  } | null>(null);

  const {
    data: stats,
    isLoading,
    error,
  } = useCategoryStats(selectedTimeRange.start, selectedTimeRange.end);

  const { data: uncategorizedActivities, isLoading: isLoadingUncategorized } =
    useUncategorizedActivities(selectedTimeRange.start, selectedTimeRange.end, 5);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCategoryMutation();

  // Fallback data for when stats are loading or unavailable
  const fallbackStats = {
    totalCategories: 0,
    totalMappings: 0,
    categorizedActivities: 0,
    uncategorizedActivities: 0,
    topCategories: [],
  };

  const currentStats = stats || fallbackStats;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleManageCategories = () => {
    navigate({ to: "/categorization/manage" });
  };

  const handleAssignCategory = (activityGroup: {
    ownerName: string;
    domain: string | null;
    sampleTitles: readonly string[];
    activityCount: number;
  }) => {
    setSelectedActivityGroup(activityGroup);
    setIsAssignModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        color: data.color || "#3b82f6",
        isSystem: false,
        order: 0,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading categorization data...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-2 text-destructive">Error loading categorization data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorization</h1>
          <p className="text-muted-foreground">
            Organize and analyze your activities with intelligent categorization
          </p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <TimeRangeSelector
            start={selectedTimeRange.start}
            end={selectedTimeRange.end}
            value={selectedTimeRange.value}
            onRangeChange={setSelectedTimeRange}
          />
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleManageCategories}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Including system categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mappings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalMappings}</div>
            <p className="text-xs text-muted-foreground">Auto-categorization rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorized Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.categorizedActivities}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.categorizedActivities + currentStats.uncategorizedActivities > 0
                ? Math.round(
                    (currentStats.categorizedActivities /
                      (currentStats.categorizedActivities + currentStats.uncategorizedActivities)) *
                      100
                  )
                : 0}
              % of total activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uncategorized</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {currentStats.uncategorizedActivities}
            </div>
            <p className="text-xs text-muted-foreground">Need manual review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Top Categories by Activity
            </CardTitle>
            <CardDescription>Most active categories based on number of activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStats.topCategories.map((category, index) => (
                <div key={category.categoryName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{category.categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.activityCount} activities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(category.totalDuration)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {currentStats.categorizedActivities > 0
                        ? Math.round(
                            (category.activityCount / currentStats.categorizedActivities) * 100
                          )
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Uncategorized Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Uncategorized Activities
            </CardTitle>
            <CardDescription>Activities that need category assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingUncategorized ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading activities...</span>
                </div>
              ) : uncategorizedActivities && uncategorizedActivities.length > 0 ? (
                uncategorizedActivities.map((activityGroup) => (
                  <div
                    key={`${activityGroup.ownerName}-${activityGroup.domain || "no-domain"}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center space-x-3">
                      <div className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{activityGroup.ownerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {activityGroup.activityCount} activities
                        </p>
                        {activityGroup.sampleTitles.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            Examples: {activityGroup.sampleTitles.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignCategory(activityGroup)}
                      className="ml-3 flex-shrink-0"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Assign Category
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">All activities are categorized!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Great job organizing your activities
                  </p>
                </div>
              )}

              {uncategorizedActivities && uncategorizedActivities.length > 0 && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => navigate({ to: "/categorization/uncategorized" })}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View All Uncategorized
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Category Modal */}
      {selectedActivityGroup && (
        <AssignCategoryModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          activityGroup={selectedActivityGroup}
        />
      )}

      {/* Category Creation Modal */}
      <CategoryFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        mode="create"
        parentCategories={categories}
        isLoading={createMutation.isPending}
        initialData={
          selectedActivityGroup
            ? {
                name: selectedActivityGroup.ownerName,
                description: `Category for ${selectedActivityGroup.ownerName} activities`,
              }
            : undefined
        }
      />
    </div>
  );
};

export default CategorizationPage;

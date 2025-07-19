import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Search,
  Plus,
  ArrowLeft,
  Calendar,
  Folder,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import {
  useUncategorizedActivities,
  useCreateCategoryMutation,
  useCategories,
} from "@/hooks/useCategoryQueries";
import { CategoryFormModal } from "./CategoryFormModal";

export const UncategorizedActivities: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedClassificationTimeRangeAtom);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [prefilledActivity, setPrefilledActivity] = useState<{
    ownerName: string;
    title: string;
  } | null>(null);

  // Fetch all uncategorized activities (no limit)
  const { data: uncategorizedActivities, isLoading } = useUncategorizedActivities(
    selectedTimeRange.start,
    selectedTimeRange.end
  );

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCategoryMutation();

  // Add a simple duration formatter
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Filter activities based on search query
  const filteredActivities =
    uncategorizedActivities?.filter((activity) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        activity.ownerName.toLowerCase().includes(searchLower) ||
        activity.title.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleCreateCategory = (ownerName: string, title: string) => {
    setPrefilledActivity({ ownerName, title });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        color: data.color || "#3b82f6",
        isSystem: false,
        order: 0,
      });
      setIsFormModalOpen(false);
      setPrefilledActivity(null);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setPrefilledActivity(null);
  };

  const totalDuration = filteredActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const activityCount = filteredActivities.length;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/categorization" })}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Categorization</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">Uncategorized Activities</h1>
            <p className="text-muted-foreground">
              Create categories for activities that aren't automatically classified
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span>Time Range</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeRangeSelector
            start={selectedTimeRange.start}
            end={selectedTimeRange.end}
            value="custom"
            onRangeChange={setSelectedTimeRange}
          />
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Activities</p>
                <p className="text-2xl font-bold">{activityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Duration</p>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Needs Categorization</p>
                <p className="text-2xl font-bold text-orange-600">{activityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
            </div>
          </div>
          <CardDescription>
            Click "Create Category" to categorize similar activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading activities...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">
                {searchQuery ? "No matching activities" : "No uncategorized activities"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query or time range."
                  : "All activities in this time range are categorized."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity, index) => (
                <div
                  key={`${activity.ownerName}-${activity.title}-${index}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{activity.ownerName}</p>
                        <p className="max-w-md truncate text-sm text-muted-foreground">
                          {activity.title}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(activity.duration)}</span>
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleCreateCategory(activity.ownerName, activity.title)}
                      className="flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Create Category</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Creation Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        mode="create"
        parentCategories={categories}
        isLoading={createMutation.isPending}
        initialData={
          prefilledActivity
            ? {
                name: prefilledActivity.ownerName,
                description: `Category for ${prefilledActivity.ownerName} activities`,
              }
            : undefined
        }
      />
    </div>
  );
};

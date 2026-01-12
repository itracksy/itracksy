/**
 * Categorization Page - Redesigned for Simplicity
 *
 * Design Philosophy:
 * 1. The main goal is to reduce uncategorized activities
 * 2. Show progress prominently to motivate users
 * 3. One clear CTA based on context
 * 4. Inline quick-assign for common apps
 */

import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";
import {
  Sparkles,
  Zap,
  Settings,
  ChevronRight,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Globe,
  Plus,
} from "lucide-react";
import {
  useCategoryStats,
  useUncategorizedActivities,
  useCategories,
  useBulkAssignCategoryMutation,
  useCategoryActivitiesDetail,
} from "@/hooks/useCategoryQueries";
import { QuickCategorize } from "./components/QuickCategorize";
import { AutoSetupWizard } from "./components/AutoSetupWizard";
import { CategoryFormModal } from "./components/CategoryFormModal";
import { useCreateCategoryMutation } from "@/hooks/useCategoryQueries";

const CategorizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedClassificationTimeRangeAtom);
  const [isQuickCategorizeOpen, setIsQuickCategorizeOpen] = useState(false);
  const [isAutoSetupOpen, setIsAutoSetupOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string>("");

  const { data: stats } = useCategoryStats(selectedTimeRange.start, selectedTimeRange.end);
  const { data: uncategorizedActivities = [] } = useUncategorizedActivities(
    selectedTimeRange.start,
    selectedTimeRange.end,
    20
  );
  const { data: categoryActivities = [] } = useCategoryActivitiesDetail(
    selectedTimeRange.start,
    selectedTimeRange.end,
    50
  );
  const { data: categories = [] } = useCategories();
  const bulkAssignMutation = useBulkAssignCategoryMutation();
  const createMutation = useCreateCategoryMutation();

  // Calculate progress
  const totalActivities =
    (stats?.categorizedActivities || 0) + (stats?.uncategorizedActivities || 0);
  const categorizedPercent =
    totalActivities > 0
      ? Math.round(((stats?.categorizedActivities || 0) / totalActivities) * 100)
      : 100;
  const uncategorizedCount = stats?.uncategorizedActivities || 0;

  // Get progress color
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-green-500";
    if (percent >= 70) return "bg-blue-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  // Quick assign handler
  const handleQuickAssign = async (
    ownerName: string,
    domain: string | null,
    categoryId: string
  ) => {
    await bulkAssignMutation.mutateAsync({
      categoryId,
      ownerName,
      domain,
      startDate: selectedTimeRange.start,
      endDate: selectedTimeRange.end,
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Time range options
  const timeRangeOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header with integrated progress */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Categorization</h1>
            {/* Compact progress indicator */}
            <div className="flex items-center gap-2">
              {uncategorizedCount > 0 ? (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {categorizedPercent}% categorized
                {uncategorizedCount > 0 && ` · ${uncategorizedCount} remaining`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uncategorizedCount > 0 ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsQuickCategorizeOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Quick Categorize
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAutoSetupOpen(true)}>
                  <Sparkles className="mr-1 h-3 w-3" />
                  Auto Setup
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsAutoSetupOpen(true)}>
                <Sparkles className="mr-1 h-3 w-3" />
                Scan New Apps
              </Button>
            )}
            <Select
              value={selectedTimeRange.value}
              onValueChange={(value) => {
                const now = new Date();
                let start: number;
                let end = now.getTime();

                switch (value) {
                  case "today":
                    start = new Date(now.setHours(0, 0, 0, 0)).getTime();
                    break;
                  case "yesterday":
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    start = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
                    end = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();
                    break;
                  case "week":
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    start = weekAgo.getTime();
                    break;
                  case "month":
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    start = monthAgo.getTime();
                    break;
                  default:
                    start = new Date(now.setHours(0, 0, 0, 0)).getTime();
                }

                setSelectedTimeRange({ value, start, end });
              }}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate({ to: "/categorization/manage" })}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Compact progress bar - only show if there are uncategorized items */}
        {uncategorizedCount > 0 && (
          <Progress
            value={categorizedPercent}
            className="h-1.5"
            // @ts-ignore - custom indicator color
            indicatorClassName={getProgressColor(categorizedPercent)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Uncategorized Apps - Inline Quick Assign */}
        {uncategorizedActivities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-muted-foreground">
                Quick Assign (click app, then category)
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {uncategorizedActivities.slice(0, 8).map((activity) => (
                <InlineAssignChip
                  key={`${activity.ownerName}-${activity.domain || ""}`}
                  ownerName={activity.ownerName}
                  domain={activity.domain}
                  count={activity.activityCount}
                  categories={categories}
                  onAssign={handleQuickAssign}
                  isLoading={bulkAssignMutation.isPending}
                />
              ))}
              {uncategorizedActivities.length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setIsQuickCategorizeOpen(true)}
                >
                  +{uncategorizedActivities.length - 8} more
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Categories</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {categoryActivities.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                value={expandedCategory}
                onValueChange={setExpandedCategory}
                className="space-y-2"
              >
                {categoryActivities.map((category) => (
                  <AccordionItem
                    key={category.categoryId}
                    value={category.categoryId}
                    className="rounded-lg border bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-90">
                      <div className="flex w-full items-center justify-between pr-2">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.categoryColor || "#666" }}
                          />
                          <div className="text-left">
                            <span className="font-medium">{category.categoryName}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {category.activityCount} activities
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {formatDuration(category.totalDuration)}
                          </span>
                          <div className="flex gap-1">
                            {category.activities.some((a) => a.isFocusMode) && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                                <Target className="mr-1 h-3 w-3" />
                                Focus
                              </Badge>
                            )}
                            {category.activities.some((a) => !a.isFocusMode) && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                <Clock className="mr-1 h-3 w-3" />
                                Break
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="ml-7 space-y-1 rounded-lg bg-muted/30 p-3">
                        {category.activities
                          .filter((a) => a.duration >= 60)
                          .slice(0, 10)
                          .map((activity, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-1 text-sm"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {activity.domain ? (
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <FolderOpen className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="truncate">
                                  {activity.domain || activity.ownerName}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {formatDuration(activity.duration)}
                              </span>
                            </div>
                          ))}
                        {category.activities.filter((a) => a.duration >= 60).length > 10 && (
                          <p className="text-xs text-muted-foreground">
                            +{category.activities.filter((a) => a.duration >= 60).length - 10} more
                            activities
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No categorized activities yet</p>
                <Button variant="link" size="sm" onClick={() => setIsAutoSetupOpen(true)}>
                  Run Auto Setup to get started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickCategorize
        open={isQuickCategorizeOpen}
        onOpenChange={setIsQuickCategorizeOpen}
        startDate={selectedTimeRange.start}
        endDate={selectedTimeRange.end}
      />
      <AutoSetupWizard open={isAutoSetupOpen} onOpenChange={setIsAutoSetupOpen} />
      <CategoryFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          // In create mode, the form validates that name is present
          if (!data.name) return;
          await createMutation.mutateAsync({
            name: data.name,
            description: data.description,
            icon: data.icon,
            parentId: data.parentId,
            color: data.color || "#3b82f6",
            isSystem: false,
            order: 0,
          });
          setIsCreateModalOpen(false);
        }}
        mode="create"
        parentCategories={categories}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

/**
 * Inline Quick Assign Chip
 * Click to expand category selector, then click category to assign
 */
interface InlineAssignChipProps {
  ownerName: string;
  domain: string | null;
  count: number;
  categories: Array<{ id: string; name: string; color: string | null }>;
  onAssign: (ownerName: string, domain: string | null, categoryId: string) => void;
  isLoading: boolean;
}

function InlineAssignChip({
  ownerName,
  domain,
  count,
  categories,
  onAssign,
  isLoading,
}: InlineAssignChipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show root categories for quick assign
  const rootCategories = categories.filter((c) => !("parentId" in c) || !(c as any).parentId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
          isOpen ? "border-primary bg-primary/10" : "border-border bg-muted/50 hover:bg-muted"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        <span className="max-w-32 truncate font-medium">{ownerName}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {count}
        </Badge>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg">
            <p className="px-2 py-1 text-xs text-muted-foreground">Assign to category:</p>
            {rootCategories.slice(0, 8).map((category) => (
              <button
                key={category.id}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                onClick={() => {
                  onAssign(ownerName, domain, category.id);
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

export default CategorizationPage;

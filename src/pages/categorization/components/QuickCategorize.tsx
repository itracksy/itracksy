/**
 * QuickCategorize Component
 *
 * A "Tinder-style" card stack interface for rapidly categorizing
 * uncategorized activities. Supports keyboard shortcuts and
 * AI-powered suggestions from macOS app metadata.
 *
 * Keyboard Shortcuts:
 * - 1-9: Select category by number
 * - Enter: Confirm suggested category
 * - S: Skip current item
 * - Escape: Close modal
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  SkipForward,
  Check,
  Keyboard,
  Zap,
  FolderOpen,
  Globe,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  useCategories,
  useUncategorizedActivities,
  useBulkAssignCategoryMutation,
  useAppMetadata,
} from "@/hooks/useCategoryQueries";

interface QuickCategorizeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate?: number;
  endDate?: number;
}

interface ActivityGroup {
  ownerName: string;
  domain: string | null;
  sampleTitles: readonly string[];
  activityCount: number;
}

export function QuickCategorize({ open, onOpenChange, startDate, endDate }: QuickCategorizeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skippedItems, setSkippedItems] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: uncategorizedActivities = [], refetch } = useUncategorizedActivities(
    startDate,
    endDate,
    50 // Get more items for the queue
  );
  const bulkAssignMutation = useBulkAssignCategoryMutation();

  // Filter out skipped items
  const pendingActivities = uncategorizedActivities.filter(
    (activity) => !skippedItems.has(`${activity.ownerName}-${activity.domain || ""}`)
  );

  const currentActivity = pendingActivities[currentIndex] as ActivityGroup | undefined;

  // Get app metadata for AI suggestion
  const { data: appMetadata } = useAppMetadata(
    currentActivity?.ownerName || "",
    currentActivity?.ownerName
  );

  // Find suggested category based on macOS metadata
  const suggestedCategory = appMetadata?.suggestedCategory
    ? categories.find((c) => c.name.toLowerCase() === appMetadata.suggestedCategory?.toLowerCase())
    : null;

  // Top categories for quick selection (sorted by usage/relevance)
  const topCategories = categories
    .filter((c) => !c.parentId) // Only root categories
    .slice(0, 9); // Limit to 9 for keyboard shortcuts

  const totalItems = uncategorizedActivities.length;
  const processedItems = skippedItems.size + currentIndex;
  const progress = totalItems > 0 ? (processedItems / totalItems) * 100 : 0;

  // Handle category assignment
  const handleAssign = useCallback(
    async (categoryId: string) => {
      if (!currentActivity) return;

      await bulkAssignMutation.mutateAsync({
        categoryId,
        ownerName: currentActivity.ownerName,
        domain: currentActivity.domain,
        startDate,
        endDate,
      });

      // Move to next item
      if (currentIndex < pendingActivities.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Refetch and reset
        await refetch();
        setCurrentIndex(0);
      }
    },
    [
      currentActivity,
      bulkAssignMutation,
      currentIndex,
      pendingActivities.length,
      startDate,
      endDate,
      refetch,
    ]
  );

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!currentActivity) return;

    setSkippedItems((prev) =>
      new Set(prev).add(`${currentActivity.ownerName}-${currentActivity.domain || ""}`)
    );

    if (currentIndex < pendingActivities.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentActivity, currentIndex, pendingActivities.length]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 for category selection
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key) - 1;
        if (topCategories[index]) {
          handleAssign(topCategories[index].id);
        }
        return;
      }

      switch (e.key) {
        case "Enter":
          // Confirm suggested category
          if (suggestedCategory) {
            handleAssign(suggestedCategory.id);
          }
          break;
        case "s":
        case "S":
          handleSkip();
          break;
        case "Escape":
          onOpenChange(false);
          break;
        case "?":
          setShowShortcuts((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, topCategories, suggestedCategory, handleAssign, handleSkip, onOpenChange]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setSkippedItems(new Set());
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Categorize
          </DialogTitle>
          <DialogDescription>
            Rapidly categorize your activities using keyboard shortcuts or clicking
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{pendingActivities.length} remaining</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Activity Card */}
        {currentActivity ? (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* App/Domain Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{currentActivity.ownerName}</span>
                    </div>
                    {currentActivity.domain && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{currentActivity.domain}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentActivity.activityCount} activities
                  </Badge>
                </div>

                {/* Sample Titles */}
                {currentActivity.sampleTitles.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Sample window titles:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {currentActivity.sampleTitles.slice(0, 3).map((title, i) => (
                        <li key={i} className="truncate text-muted-foreground">
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Suggestion */}
                {suggestedCategory && (
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">AI Suggests:</span>
                      <Badge
                        style={{
                          backgroundColor: suggestedCategory.color || undefined,
                          color: suggestedCategory.color ? "#fff" : undefined,
                        }}
                      >
                        {suggestedCategory.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((appMetadata?.confidence || 0) * 100)}% confidence)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/50 text-green-600 hover:bg-green-500/20"
                      onClick={() => handleAssign(suggestedCategory.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Accept (Enter)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Check className="mb-4 h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">No more activities to categorize</p>
            </CardContent>
          </Card>
        )}

        {/* Category Selection Grid */}
        {currentActivity && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Select a category (use number keys 1-9):
            </p>
            <div className="grid grid-cols-3 gap-2">
              {topCategories.map((category, index) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-auto flex-col items-start gap-1 p-3 text-left"
                  onClick={() => handleAssign(category.id)}
                  disabled={bulkAssignMutation.isPending}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color || "#666" }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(!showShortcuts)}>
            <Keyboard className="mr-2 h-4 w-4" />
            {showShortcuts ? "Hide" : "Show"} Shortcuts
          </Button>

          <div className="flex gap-2">
            {currentActivity && (
              <Button variant="outline" onClick={handleSkip}>
                <SkipForward className="mr-2 h-4 w-4" />
                Skip (S)
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        {showShortcuts && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">1-9</kbd>
                <span>Select category</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Enter</kbd>
                <span>Accept AI suggestion</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">S</kbd>
                <span>Skip item</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuickCategorize;

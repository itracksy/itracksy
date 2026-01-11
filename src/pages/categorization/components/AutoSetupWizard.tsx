/**
 * AutoSetupWizard Component
 *
 * Scans installed macOS applications and suggests category mappings
 * based on native metadata (LSApplicationCategoryType) and vendor prefixes.
 *
 * This implements the "Phase 1: Smart Metadata" strategy from the
 * classification waterfall, enabling 60-70% auto-categorization without
 * user configuration.
 */

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Wand2,
  Loader2,
  Check,
  Sparkles,
  FolderOpen,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  useAppSuggestions,
  useAutoCreateMappingsMutation,
  useCategories,
} from "@/hooks/useCategoryQueries";

interface AutoSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type WizardStep = "intro" | "scanning" | "review" | "applying" | "complete";

export function AutoSetupWizard({ open, onOpenChange, onComplete }: AutoSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("intro");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());

  const { data: suggestions = [], isLoading: isScanning, refetch } = useAppSuggestions();
  const { data: categories = [] } = useCategories();
  const autoCreateMutation = useAutoCreateMappingsMutation();

  // Group suggestions by category
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, typeof suggestions> = {};
    for (const app of suggestions) {
      const category = app.suggestedCategory;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(app);
    }
    return groups;
  }, [suggestions]);

  // Stats
  const totalApps = suggestions.length;
  const selectedCount = selectedApps.size;
  const categoryCount = Object.keys(groupedSuggestions).length;

  // Handle app selection
  const toggleApp = (bundleId: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(bundleId)) {
      newSelected.delete(bundleId);
    } else {
      newSelected.add(bundleId);
    }
    setSelectedApps(newSelected);
  };

  // Select all / deselect all for a category
  const toggleCategory = (category: string) => {
    const categoryApps = groupedSuggestions[category] || [];
    const allSelected = categoryApps.every((app) => selectedApps.has(app.bundleId));

    const newSelected = new Set(selectedApps);
    for (const app of categoryApps) {
      if (allSelected) {
        newSelected.delete(app.bundleId);
      } else {
        newSelected.add(app.bundleId);
      }
    }
    setSelectedApps(newSelected);
  };

  // Select all
  const selectAll = () => {
    setSelectedApps(new Set(suggestions.map((app) => app.bundleId)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedApps(new Set());
  };

  // Start scanning
  const handleStartScan = async () => {
    setStep("scanning");
    await refetch();
    // Auto-select all after scanning
    setSelectedApps(new Set(suggestions.map((app) => app.bundleId)));
    setStep("review");
  };

  // Apply selected mappings
  const handleApply = async () => {
    setStep("applying");

    const appsToCreate = suggestions
      .filter((app) => selectedApps.has(app.bundleId))
      .map((app) => ({
        bundleId: app.bundleId,
        appName: app.appName,
        suggestedCategory: app.suggestedCategory,
      }));

    await autoCreateMutation.mutateAsync({ apps: appsToCreate });
    setStep("complete");
  };

  // Close and reset
  const handleClose = () => {
    setStep("intro");
    setSelectedApps(new Set());
    onOpenChange(false);
    onComplete?.();
  };

  // Get category color
  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    return category?.color || "#666";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Smart Auto-Setup
          </DialogTitle>
          <DialogDescription>
            Automatically categorize your apps using macOS metadata
          </DialogDescription>
        </DialogHeader>

        {/* Step: Intro */}
        {step === "intro" && (
          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Instant App Recognition</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll scan your installed apps and suggest categories based on Apple's metadata
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">No manual configuration needed</p>
                    <p className="text-xs text-muted-foreground">
                      Apps are categorized using their official App Store category
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Privacy-first</p>
                    <p className="text-xs text-muted-foreground">
                      All scanning happens locally on your Mac
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Review before applying</p>
                    <p className="text-xs text-muted-foreground">
                      You can adjust any suggestions before they're applied
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartScan}>
                <Wand2 className="mr-2 h-4 w-4" />
                Scan My Apps
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Scanning */}
        {step === "scanning" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <div className="text-center">
              <h3 className="font-semibold">Scanning Applications...</h3>
              <p className="text-sm text-muted-foreground">Reading app metadata from your Mac</p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold text-purple-500">{totalApps}</span> apps found
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-green-500">{categoryCount}</span> categories
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{selectedCount}</span> selected
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* App List */}
            <ScrollArea className="h-[400px] rounded-lg border">
              <div className="space-y-4 p-4">
                {Object.entries(groupedSuggestions).map(([category, apps]) => {
                  const allSelected = apps.every((app) => selectedApps.has(app.bundleId));
                  const someSelected = apps.some((app) => selectedApps.has(app.bundleId));

                  return (
                    <div key={category} className="space-y-2">
                      {/* Category Header */}
                      <button
                        className="flex w-full items-center gap-3 rounded-lg bg-muted/30 p-2 hover:bg-muted/50"
                        onClick={() => toggleCategory(category)}
                      >
                        <Checkbox
                          checked={allSelected}
                          // @ts-ignore - indeterminate is valid
                          indeterminate={someSelected && !allSelected}
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category) }}
                        />
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {apps.length} apps
                        </Badge>
                      </button>

                      {/* App Items */}
                      <div className="ml-8 space-y-1">
                        {apps.map((app) => (
                          <button
                            key={app.bundleId}
                            className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted/30"
                            onClick={() => toggleApp(app.bundleId)}
                          >
                            <Checkbox checked={selectedApps.has(app.bundleId)} />
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-left text-sm">{app.appName}</span>
                            {app.confidence >= 0.9 && (
                              <Badge variant="outline" className="text-xs text-green-500">
                                High confidence
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("intro")}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={selectedCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Apply {selectedCount} Rules
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Applying */}
        {step === "applying" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <div className="text-center">
              <h3 className="font-semibold">Creating Rules...</h3>
              <p className="text-sm text-muted-foreground">Setting up automatic categorization</p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Setup Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Created {autoCreateMutation.data?.created || 0} category rules
                </p>
              </div>
            </div>

            {autoCreateMutation.data && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 font-medium">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rules created:</span>
                    <span className="ml-2 font-semibold text-green-500">
                      {autoCreateMutation.data.created}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skipped:</span>
                    <span className="ml-2 font-semibold">{autoCreateMutation.data.skipped}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>
                <ChevronRight className="mr-2 h-4 w-4" />
                Continue to Dashboard
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AutoSetupWizard;

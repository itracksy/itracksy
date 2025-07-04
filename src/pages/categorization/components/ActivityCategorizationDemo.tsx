import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Zap, Target } from "lucide-react";
import {
  useCategorizeActivityMutation,
  useCategoryMappings,
  useCategories,
} from "@/hooks/useCategoryQueries";

interface ActivityCategorizationDemoProps {
  // Example activity data
  activity?: {
    ownerName: string;
    url?: string;
    title: string;
    timestamp: number;
  };
}

export const ActivityCategorizationDemo: React.FC<ActivityCategorizationDemoProps> = ({
  activity,
}) => {
  const [testActivity, setTestActivity] = useState({
    ownerName: activity?.ownerName || "Visual Studio Code",
    url: activity?.url || "https://github.com/user/repo",
    title: activity?.title || "Working on React component",
  });

  const { data: categories } = useCategories();
  const { data: mappings } = useCategoryMappings();
  const categorizeActivityMutation = useCategorizeActivityMutation();

  const handleTestCategorization = async () => {
    if (!activity?.timestamp) return;

    try {
      await categorizeActivityMutation.mutateAsync(activity.timestamp);
    } catch (error) {
      console.error("Failed to categorize activity:", error);
    }
  };

  const predictCategory = () => {
    if (!mappings || !categories) return null;

    // Simple prediction logic (similar to the backend matching)
    for (const mapping of mappings) {
      // Check app name match
      if (
        mapping.appName &&
        testActivity.ownerName.toLowerCase().includes(mapping.appName.toLowerCase())
      ) {
        const category = categories.find((c) => c.id === mapping.categoryId);
        return { category, mapping, matchedBy: "appName" };
      }

      // Check domain match
      if (mapping.domain && testActivity.url) {
        try {
          const url = new URL(testActivity.url);
          if (url.hostname.includes(mapping.domain)) {
            const category = categories.find((c) => c.id === mapping.categoryId);
            return { category, mapping, matchedBy: "domain" };
          }
        } catch {
          // Invalid URL, skip
        }
      }

      // Check title pattern (basic implementation)
      if (
        mapping.titlePattern &&
        testActivity.title.toLowerCase().includes(mapping.titlePattern.toLowerCase())
      ) {
        const category = categories.find((c) => c.id === mapping.categoryId);
        return { category, mapping, matchedBy: "title" };
      }
    }

    return null;
  };

  const prediction = predictCategory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Activity Categorization Demo</span>
          </CardTitle>
          <CardDescription>
            Test how the system automatically detects categories for activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Activity Input */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">App Name</label>
              <Input
                value={testActivity.ownerName}
                onChange={(e) => setTestActivity({ ...testActivity, ownerName: e.target.value })}
                placeholder="e.g., Visual Studio Code, Chrome, Slack"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                URL (optional)
              </label>
              <Input
                value={testActivity.url}
                onChange={(e) => setTestActivity({ ...testActivity, url: e.target.value })}
                placeholder="e.g., https://github.com/user/repo"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
              <Input
                value={testActivity.title}
                onChange={(e) => setTestActivity({ ...testActivity, title: e.target.value })}
                placeholder="e.g., Working on React component"
              />
            </div>
          </div>

          {/* Prediction Result */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium text-foreground">Predicted Category:</h4>
            {prediction ? (
              <div className="flex items-center space-x-2">
                <Badge
                  style={{ backgroundColor: prediction.category?.color || "#3b82f6" }}
                  className="text-white"
                >
                  {prediction.category?.icon} {prediction.category?.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  (matched by {prediction.matchedBy})
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No matching category found</span>
            )}
          </div>

          {/* Actions */}
          {activity && (
            <div className="flex space-x-2">
              <Button
                onClick={handleTestCategorization}
                disabled={categorizeActivityMutation.isPending}
                className="flex-1"
              >
                {categorizeActivityMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Auto-Categorize This Activity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Categorization Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground">1. App Name Matching</h4>
              <p className="text-muted-foreground">
                Maps application names to categories (e.g., "Visual Studio Code" → "Development")
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground">2. Domain Matching</h4>
              <p className="text-muted-foreground">
                Uses website domains for categorization (e.g., "github.com" → "Development")
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground">3. Title Pattern Matching</h4>
              <p className="text-muted-foreground">
                Analyzes activity titles for keywords (e.g., "tutorial" → "Learning")
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground">4. Priority-Based Selection</h4>
              <p className="text-muted-foreground">
                Higher priority mappings take precedence when multiple matches are found
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

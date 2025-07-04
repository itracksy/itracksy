import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useCategoryStats } from "@/hooks/useCategoryQueries";

const CategorizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useCategoryStats();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Categorization</h1>
          <p className="text-muted-foreground">
            Organize and analyze your activities with intelligent categorization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleManageCategories}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tags className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Manage your categorization system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Category
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Add Mapping Rule
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Categorize Pending Activities
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleManageCategories}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Categorization Activity</CardTitle>
          <CardDescription>
            Latest activities that have been automatically categorized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                <div>
                  <p className="font-medium">Visual Studio Code</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically categorized as Development
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Development</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically categorized as Communication
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Communication</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                <div>
                  <p className="font-medium">Unknown Application</p>
                  <p className="text-sm text-muted-foreground">Needs manual categorization</p>
                </div>
              </div>
              <Badge variant="outline">Uncategorized</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorizationPage;

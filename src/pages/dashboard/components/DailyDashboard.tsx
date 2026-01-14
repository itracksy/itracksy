/**
 * Daily Dashboard - Experimental Home-style view
 *
 * Shows a comprehensive daily overview similar to the reference design:
 * - Total Active Time with big display
 * - Productivity Score with breakdown
 * - Context Switches with deep work blocks
 * - Hourly timeline chart by category
 * - Top Usage and Applications list
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Zap,
  Clock,
  ChevronRight,
  Folder,
  Globe,
  Monitor,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyDashboardProps {
  timeRange: TimeRange;
  boardId?: string;
}

// Category colors matching the reference
const CATEGORY_COLORS = {
  Development: "#3b82f6", // Blue
  Browsers: "#60a5fa", // Light blue
  Communication: "#f97316", // Orange
  Utilities: "#8b5cf6", // Purple
  Other: "#94a3b8", // Gray
};

type CategoryType = keyof typeof CATEGORY_COLORS;

// App to category mapping
const APP_CATEGORIES: Record<string, CategoryType> = {
  // Development
  Code: "Development",
  "Visual Studio Code": "Development",
  Cursor: "Development",
  Xcode: "Development",
  Terminal: "Development",
  iTerm2: "Development",
  WebStorm: "Development",
  IntelliJ: "Development",
  PyCharm: "Development",
  "Android Studio": "Development",
  Sublime: "Development",
  Atom: "Development",
  Neovim: "Development",
  nvim: "Development",
  vim: "Development",

  // Browsers
  "Google Chrome": "Browsers",
  Chrome: "Browsers",
  Safari: "Browsers",
  Firefox: "Browsers",
  Arc: "Browsers",
  Edge: "Browsers",
  Brave: "Browsers",
  Opera: "Browsers",

  // Communication
  Slack: "Communication",
  Discord: "Communication",
  "Microsoft Teams": "Communication",
  Teams: "Communication",
  Zoom: "Communication",
  Messages: "Communication",
  Mail: "Communication",
  Telegram: "Communication",
  WhatsApp: "Communication",

  // Utilities
  Finder: "Utilities",
  "System Preferences": "Utilities",
  "System Settings": "Utilities",
  Preview: "Utilities",
  Notes: "Utilities",
  Reminders: "Utilities",
  Calendar: "Utilities",
  Calculator: "Utilities",
  Activity: "Utilities",
};

const getAppCategory = (appName: string): CategoryType => {
  // Check exact match first
  if (APP_CATEGORIES[appName]) {
    return APP_CATEGORIES[appName];
  }

  // Check partial match
  const lowerApp = appName.toLowerCase();
  for (const [key, category] of Object.entries(APP_CATEGORIES)) {
    if (lowerApp.includes(key.toLowerCase())) {
      return category;
    }
  }

  return "Other";
};

export function DailyDashboard({ timeRange, boardId }: DailyDashboardProps) {
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

  // Fetch hourly data
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
    refetchInterval: 30000,
  });

  // Fetch focus performance for productivity score
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: [
      "dashboard.getFocusPerformanceByPeriod",
      timeRange.start,
      timeRange.end,
      "daily",
      boardId,
    ],
    queryFn: () =>
      trpcClient.dashboard.getFocusPerformanceByPeriod.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        period: "daily",
        boardId,
      }),
    refetchInterval: 30000,
  });

  // Process data for dashboard
  const dashboardData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return {
        totalActiveTime: 0,
        productivityScore: 0,
        productivityLabel: "No Data",
        productivityBreakdown: { productive: 0, neutral: 0, distracting: 0 },
        contextSwitches: 0,
        avgSwitchTime: 0,
        deepBlocks: 0,
        trend: 0,
        hourlyByCategory: [] as { hour: number; categories: Record<CategoryType, number> }[],
        topUsage: [] as {
          name: string;
          type: "folder" | "domain";
          duration: number;
          via?: string;
        }[],
        applications: [] as {
          name: string;
          category: CategoryType;
          duration: number;
          details: { title: string; duration: number }[];
        }[],
      };
    }

    // Calculate total active time
    let totalActiveTime = 0;
    let productiveTime = 0;
    let distractingTime = 0;
    let contextSwitches = 0;
    const appDurations = new Map<
      string,
      { duration: number; category: CategoryType; details: Map<string, number> }
    >();
    const folderDurations = new Map<string, { duration: number; via: string }>();
    const domainDurations = new Map<string, { duration: number; visits: number }>();

    // Process hourly data
    const hourlyByCategory: { hour: number; categories: Record<CategoryType, number> }[] = [];

    for (const hour of hourlyData) {
      const focusSeconds = hour.totalSecondsFocusedTime || 0;
      const breakSeconds = hour.totalSecondsBreakTime || 0;
      totalActiveTime += focusSeconds + breakSeconds;

      // Calculate categories for this hour
      const hourCategories: Record<CategoryType, number> = {
        Development: 0,
        Browsers: 0,
        Communication: 0,
        Utilities: 0,
        Other: 0,
      };

      for (const activity of hour.activities || []) {
        const category = getAppCategory(activity.ownerName);
        hourCategories[category] += activity.duration;

        // Track app durations
        const existing = appDurations.get(activity.ownerName) || {
          duration: 0,
          category,
          details: new Map<string, number>(),
        };
        existing.duration += activity.duration;
        const titleDuration = existing.details.get(activity.title) || 0;
        existing.details.set(activity.title, titleDuration + activity.duration);
        appDurations.set(activity.ownerName, existing);

        // Track productive vs distracting time based on focus mode
        if (activity.isFocusMode) {
          productiveTime += activity.duration;
        } else {
          distractingTime += activity.duration;
        }

        // Extract folder from title if it's a dev app
        if (category === "Development" && activity.title) {
          const folderMatch = activity.title.match(/^([^—–-]+)/);
          if (folderMatch) {
            const folder = folderMatch[1].trim();
            const existingFolder = folderDurations.get(folder) || {
              duration: 0,
              via: activity.ownerName,
            };
            existingFolder.duration += activity.duration;
            folderDurations.set(folder, existingFolder);
          }
        }

        // Extract domain from title if it's a browser
        if (category === "Browsers" && activity.title) {
          const domainMatch = activity.title.match(/(?:https?:\/\/)?([^\/\s]+)/i);
          if (domainMatch) {
            let domain = domainMatch[1].toLowerCase();
            // Clean up common prefixes
            domain = domain.replace(/^www\./, "");
            if (domain && domain.includes(".")) {
              const existingDomain = domainDurations.get(domain) || { duration: 0, visits: 0 };
              existingDomain.duration += activity.duration;
              existingDomain.visits += 1;
              domainDurations.set(domain, existingDomain);
            }
          }
        }
      }

      hourlyByCategory.push({ hour: hour.hour, categories: hourCategories });
    }

    // Estimate context switches (app changes between consecutive activities)
    let lastApp = "";
    for (const hour of hourlyData) {
      for (const activity of hour.activities || []) {
        if (lastApp && lastApp !== activity.ownerName) {
          contextSwitches++;
        }
        lastApp = activity.ownerName;
      }
    }

    // Calculate productivity metrics
    const totalRatedTime = productiveTime + distractingTime;
    const productivityScore =
      totalRatedTime > 0 ? Math.round((productiveTime / totalRatedTime) * 100) : 0;
    const neutralTime = totalActiveTime - totalRatedTime;

    const productivityBreakdown = {
      productive: totalActiveTime > 0 ? Math.round((productiveTime / totalActiveTime) * 100) : 0,
      neutral: totalActiveTime > 0 ? Math.round((neutralTime / totalActiveTime) * 100) : 0,
      distracting: totalActiveTime > 0 ? Math.round((distractingTime / totalActiveTime) * 100) : 0,
    };

    // Determine productivity label
    let productivityLabel = "No Data";
    if (productivityScore >= 80) productivityLabel = "Excellent";
    else if (productivityScore >= 60) productivityLabel = "Good";
    else if (productivityScore >= 40) productivityLabel = "Average";
    else if (productivityScore > 0) productivityLabel = "Needs Focus";

    // Calculate avg switch time and deep blocks
    const avgSwitchTime =
      contextSwitches > 0 ? Math.round(totalActiveTime / contextSwitches / 60) : 0;

    // Deep blocks: periods of 25+ minutes continuous focus
    const focusBlocks = hourlyData.filter((h) => h.totalSecondsFocusedTime >= 1500);
    const deepBlocks = focusBlocks.length;

    // Get trend from performance data
    let trend = 0;
    if (performanceData && performanceData.length >= 2) {
      const today = performanceData[performanceData.length - 1];
      const yesterday = performanceData[performanceData.length - 2];
      if (yesterday?.totalFocusTime > 0 && today?.totalFocusTime > 0) {
        trend = Math.round(
          ((today.totalFocusTime - yesterday.totalFocusTime) / yesterday.totalFocusTime) * 100
        );
      }
    }

    // Build top usage list
    const topUsage: { name: string; type: "folder" | "domain"; duration: number; via?: string }[] =
      [];

    // Add top folders
    Array.from(folderDurations.entries())
      .sort((a, b) => b[1].duration - a[1].duration)
      .slice(0, 3)
      .forEach(([folder, data]) => {
        topUsage.push({ name: folder, type: "folder", duration: data.duration, via: data.via });
      });

    // Add top domains
    Array.from(domainDurations.entries())
      .sort((a, b) => b[1].duration - a[1].duration)
      .slice(0, 3)
      .forEach(([domain, data]) => {
        topUsage.push({ name: domain, type: "domain", duration: data.duration });
      });

    // Sort by duration
    topUsage.sort((a, b) => b.duration - a.duration);

    // Build applications list
    const applications = Array.from(appDurations.entries())
      .map(([name, data]) => ({
        name,
        category: data.category,
        duration: data.duration,
        details: Array.from(data.details.entries())
          .map(([title, duration]) => ({ title, duration }))
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5),
      }))
      .sort((a, b) => b.duration - a.duration);

    return {
      totalActiveTime,
      productivityScore,
      productivityLabel,
      productivityBreakdown,
      contextSwitches,
      avgSwitchTime,
      deepBlocks,
      trend,
      hourlyByCategory,
      topUsage: topUsage.slice(0, 5),
      applications,
    };
  }, [hourlyData, performanceData]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const formatDurationShort = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const isLoading = hourlyLoading || performanceLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Generate hours for chart (0-23)
  const chartHours = Array.from({ length: 24 }, (_, i) => i);
  const maxHourlyValue = Math.max(
    ...dashboardData.hourlyByCategory.map((h) =>
      Object.values(h.categories).reduce((sum, v) => sum + v, 0)
    ),
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Total Active Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">
                {formatDuration(dashboardData.totalActiveTime)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                Total Active Time
              </span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Productivity Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    {dashboardData.productivityScore}
                  </span>
                  {dashboardData.trend !== 0 && (
                    <span
                      className={`flex items-center text-sm ${dashboardData.trend > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {dashboardData.trend > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(dashboardData.trend)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {dashboardData.productivityLabel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Productivity</span>
                </div>
              </div>
            </div>
            {/* Productivity breakdown bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  <div
                    className="bg-green-500"
                    style={{ width: `${dashboardData.productivityBreakdown.productive}%` }}
                  />
                  <div
                    className="bg-yellow-400"
                    style={{ width: `${dashboardData.productivityBreakdown.neutral}%` }}
                  />
                  <div
                    className="bg-red-400"
                    style={{ width: `${dashboardData.productivityBreakdown.distracting}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{dashboardData.productivityBreakdown.productive}% Productive</span>
                <span>{dashboardData.productivityBreakdown.neutral}% Neutral</span>
                <span>{dashboardData.productivityBreakdown.distracting}% Distracting</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Switches */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    {dashboardData.contextSwitches}
                  </span>
                  <span className="text-lg text-muted-foreground">switches</span>
                </div>
                <Badge variant="outline" className="mt-2">
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  avg {dashboardData.avgSwitchTime}m
                </div>
                <div className="mt-1 flex items-center gap-1 text-amber-600">
                  <Zap className="h-3 w-3" />
                  {dashboardData.deepBlocks} deep blocks
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart and Top Usage */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
              <div className="flex flex-wrap gap-3 text-xs">
                {(Object.keys(CATEGORY_COLORS) as CategoryType[]).map((cat) => (
                  <div key={cat} className="flex items-center gap-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span className="text-muted-foreground">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stacked Bar Chart */}
            <div className="h-48">
              <div className="flex h-full items-end gap-0.5">
                {chartHours.map((hour) => {
                  const hourData = dashboardData.hourlyByCategory.find((h) => h.hour === hour);
                  const categories = hourData?.categories || {
                    Development: 0,
                    Browsers: 0,
                    Communication: 0,
                    Utilities: 0,
                    Other: 0,
                  };
                  const total = Object.values(categories).reduce((sum, v) => sum + v, 0);
                  const heightPercent = maxHourlyValue > 0 ? (total / maxHourlyValue) * 100 : 0;

                  return (
                    <TooltipProvider key={hour} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex flex-1 cursor-pointer flex-col justify-end overflow-hidden rounded-t transition-opacity hover:opacity-80"
                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                          >
                            {(Object.keys(CATEGORY_COLORS) as CategoryType[])
                              .filter((cat) => categories[cat] > 0)
                              .map((cat) => (
                                <div
                                  key={cat}
                                  style={{
                                    backgroundColor: CATEGORY_COLORS[cat],
                                    flex: categories[cat],
                                  }}
                                />
                              ))}
                            {total === 0 && <div className="flex-1 bg-muted/30" />}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{hour}:00</p>
                          {total > 0 ? (
                            <div className="space-y-0.5">
                              {(Object.entries(categories) as [CategoryType, number][])
                                .filter(([, dur]) => dur > 0)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, dur]) => (
                                  <p key={cat} className="text-muted-foreground">
                                    {cat}: {formatDurationShort(dur)}
                                  </p>
                                ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No activity</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              {/* Hour labels */}
              <div className="mt-1 flex text-[10px] text-muted-foreground">
                {chartHours
                  .filter((h) => h % 3 === 0)
                  .map((hour) => (
                    <div key={hour} className="flex-1 text-center" style={{ flex: 3 }}>
                      {hour.toString().padStart(2, "0")}
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.topUsage.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No usage data yet
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.topUsage.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-medium text-primary">{i + 1}</span>
                    {item.type === "folder" ? (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      {item.via && <p className="text-xs text-muted-foreground">via {item.via}</p>}
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatDuration(item.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.applications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No application data yet
            </div>
          ) : (
            <div className="space-y-1">
              {dashboardData.applications.slice(0, 10).map((app) => (
                <div key={app.name}>
                  <button
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted/50"
                    onClick={() => {
                      setExpandedApps((prev) => {
                        const next = new Set(prev);
                        if (next.has(app.name)) {
                          next.delete(app.name);
                        } else {
                          next.add(app.name);
                        }
                        return next;
                      });
                    }}
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        expandedApps.has(app.name) ? "rotate-90" : ""
                      }`}
                    />
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 font-medium">{app.name}</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[app.category]}20`,
                        color: CATEGORY_COLORS[app.category],
                      }}
                    >
                      {app.category}
                    </Badge>
                    <span className="ml-2 text-sm font-medium text-green-600">
                      {formatDuration(app.duration)}
                    </span>
                  </button>
                  {expandedApps.has(app.name) && app.details.length > 0 && (
                    <div className="ml-12 space-y-1 border-l-2 border-muted pb-2 pl-4">
                      {app.details.map((detail, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="max-w-[400px] truncate text-muted-foreground">
                            {detail.title}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatDuration(detail.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

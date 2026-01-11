/**
 * Category Breakdown - Layer 2: Tactical Insight
 *
 * Horizontal bar chart ranking time by category/project.
 * Horizontal bars preferred over pie charts for readability.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";

interface CategoryBreakdownProps {
  timeRange: TimeRange;
  boardId?: string;
}

interface CategoryItem {
  name: string;
  duration: number;
  percentage: number;
  color: string;
}

// Semantic color palette
const COLORS = [
  "#E5A853", // Gold - primary
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

export function CategoryBreakdown({ timeRange, boardId }: CategoryBreakdownProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["dashboard.reportProjectByDay", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.reportProjectByDay.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
    refetchInterval: 30000,
  });

  const categories = useMemo<CategoryItem[]>(() => {
    if (!report || report.projects.length === 0) return [];

    const total = report.totalDuration;
    if (total === 0) return [];

    return report.projects
      .map((project, i) => ({
        name: project.name || "Unassigned",
        duration: project.totalDuration,
        percentage: Math.round((project.totalDuration / total) * 100),
        color: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 6); // Top 6 only
  }, [report]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No project data yet
      </div>
    );
  }

  const maxDuration = Math.max(...categories.map((c) => c.duration));

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.name} className="space-y-1">
          {/* Label row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.name}</span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {formatDuration(category.duration)}
            </span>
          </div>

          {/* Bar */}
          <div className="h-2 w-full rounded-full bg-muted/50">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(category.duration / maxDuration) * 100}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

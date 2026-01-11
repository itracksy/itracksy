/**
 * Top Apps - Layer 2: Tactical Insight
 *
 * Shows most used apps, distinguishing productive vs distracting.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopAppsProps {
  timeRange: TimeRange;
  boardId?: string;
}

export function TopApps({ timeRange, boardId }: TopAppsProps) {
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
    refetchInterval: 30000,
  });

  const apps = useMemo(() => {
    if (!hourlyData) return [];

    // Aggregate app usage across all hours
    const appMap = new Map<string, { duration: number; isFocus: boolean }>();

    for (const hour of hourlyData) {
      for (const activity of hour.activities || []) {
        const existing = appMap.get(activity.ownerName) || { duration: 0, isFocus: true };
        appMap.set(activity.ownerName, {
          duration: existing.duration + activity.duration,
          isFocus: activity.isFocusMode,
        });
      }
    }

    return Array.from(appMap.entries())
      .map(([name, data]) => ({
        name,
        duration: data.duration,
        isFocus: data.isFocus,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }, [hourlyData]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No app data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app, i) => (
        <div
          key={app.name}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
            <span className="max-w-[140px] truncate text-sm font-medium">{app.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatDuration(app.duration)}
            </span>
            {app.isFocus ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-orange-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

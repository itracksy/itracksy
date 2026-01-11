import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";
import { Flame, Calendar, TrendingUp } from "lucide-react";

const LEVEL_COLORS = [
  "bg-muted",
  "bg-[#E5A853]/25",
  "bg-[#E5A853]/50",
  "bg-[#E5A853]/75",
  "bg-[#E5A853]",
] as const;

interface DailyActivityData {
  date: string;
  focusHours: number;
  activityCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function ActivityHeatmap() {
  const months = 3; // Always show 3 months

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard.getActivityHeatmap", months],
    queryFn: () => trpcClient.dashboard.getActivityHeatmap.query({ months }),
    refetchInterval: 60000,
  });

  // Organize data into a grid: 7 rows (days) x N columns (weeks)
  const { weeks, monthLabels } = useMemo(() => {
    if (!data?.days.length) return { weeks: [], monthLabels: [] };

    // Create a map of date -> day data
    const dayMap = new Map<string, DailyActivityData>();
    for (const day of data.days) {
      dayMap.set(day.date, day);
    }

    // Find the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Adjust start to the beginning of that week (Sunday)
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // Adjust end to the end of current week (Saturday)
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    // Build weeks array
    const weeksArr: (DailyActivityData | null)[][] = [];
    const monthLabelsArr: { label: string; weekIndex: number }[] = [];
    let currentDate = new Date(startDate);
    let weekIndex = 0;
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const week: (DailyActivityData | null)[] = [];

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayData = dayMap.get(dateStr);

        // Only include dates up to today
        if (currentDate <= new Date()) {
          week.push(dayData || { date: dateStr, focusHours: 0, activityCount: 0, level: 0 });
        } else {
          week.push(null); // Future dates
        }

        // Track month changes for labels
        const month = currentDate.getMonth();
        if (month !== lastMonth && day === 0) {
          monthLabelsArr.push({
            label: currentDate.toLocaleDateString("en-US", { month: "short" }),
            weekIndex,
          });
          lastMonth = month;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeksArr.push(week);
      weekIndex++;
    }

    return { weeks: weeksArr, monthLabels: monthLabelsArr };
  }, [data, months]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return "0m";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-[#E5A853]" />
          Activity (Last 3 Months)
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats - responsive */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-semibold">{data.currentStreak}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-semibold">{formatHours(data.averageDailyHours)}</span>
            <span className="text-muted-foreground">avg/day</span>
          </div>
        </div>

        {/* Heatmap - responsive with horizontal scroll on small screens */}
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="inline-flex flex-col gap-1">
            {/* Month labels row - optimized for 3 months */}
            <div className="flex h-4 items-end">
              <div className="w-6 shrink-0" />
              <div className="relative flex-1">
                {monthLabels.map((m, i) => (
                  <span
                    key={i}
                    className="absolute text-[10px] font-medium text-muted-foreground"
                    style={{ left: `${m.weekIndex * 14}px` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Grid: days as rows, weeks as columns */}
            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex w-6 shrink-0 flex-col gap-0.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="flex h-[12px] w-full items-center justify-end pr-1 text-[9px] text-muted-foreground"
                  >
                    {i % 2 === 1 ? day : ""}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex gap-0.5">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {week.map((day, dayIndex) => (
                      <TooltipProvider key={`${weekIndex}-${dayIndex}`} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[12px] w-[12px] rounded-[2px] ${
                                day ? LEVEL_COLORS[day.level] : "bg-transparent"
                              } ${day ? "cursor-pointer transition-all hover:ring-1 hover:ring-foreground/30" : ""}`}
                            />
                          </TooltipTrigger>
                          {day && (
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-medium">{formatDate(day.date)}</div>
                              <div className="text-muted-foreground">
                                {day.focusHours > 0
                                  ? `${formatHours(day.focusHours)} focus time`
                                  : "No activity"}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Total + Legend - responsive */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            Total:{" "}
            <span className="font-medium text-foreground">{formatHours(data.totalFocusHours)}</span>
          </span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {LEVEL_COLORS.map((color, i) => (
              <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

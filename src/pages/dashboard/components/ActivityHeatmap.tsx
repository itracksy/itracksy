import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Flame, Calendar, TrendingUp, Clock } from "lucide-react";

const LEVEL_COLORS = {
  0: "bg-gray-100 dark:bg-gray-800",
  1: "bg-[#E5A853]/20",
  2: "bg-[#E5A853]/40",
  3: "bg-[#E5A853]/70",
  4: "bg-[#E5A853]",
};

const LEVEL_LABELS = {
  0: "No activity",
  1: "Light (0-2h)",
  2: "Medium (2-4h)",
  3: "Good (4-6h)",
  4: "Excellent (6h+)",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DailyActivityData {
  date: string;
  focusHours: number;
  activityCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatmapProps {
  compact?: boolean;
}

export function ActivityHeatmap({ compact = false }: ActivityHeatmapProps) {
  const [months, setMonths] = useState(compact ? 1 : 3);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard.getActivityHeatmap", months],
    queryFn: () => trpcClient.dashboard.getActivityHeatmap.query({ months }),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className={compact ? "p-4 pb-2" : ""}>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[#E5A853]" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent className={compact ? "p-4 pt-0" : ""}>
          <div className="flex h-24 items-center justify-center">
            <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Group days into weeks for the grid
  const weeks: DailyActivityData[][] = [];
  let currentWeek: DailyActivityData[] = [];

  if (data.days.length > 0) {
    const firstDay = new Date(data.days[0].date);
    const dayOfWeek = firstDay.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: "", focusHours: 0, activityCount: 0, level: 0 });
    }
  }

  for (const day of data.days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", focusHours: 0, activityCount: 0, level: 0 });
    }
    weeks.push(currentWeek);
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return "0h";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Compact version
  if (compact) {
    return (
      <Card>
        <CardHeader className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-[#E5A853]" />
              Activity
            </CardTitle>
            <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 month</SelectItem>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 pt-0">
          {/* Compact Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-xs text-muted-foreground">Streak</div>
                <div className="text-base font-semibold">{data.currentStreak} days</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-xs text-muted-foreground">Daily Avg</div>
                <div className="text-base font-semibold">{formatHours(data.averageDailyHours)}</div>
              </div>
            </div>
          </div>

          {/* Compact Heatmap Grid */}
          <div className="overflow-x-auto py-2">
            <div className="min-w-fit">
              {/* Weekday labels - compact */}
              <div className="mb-2 flex">
                <div className="w-5" />
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="w-[14px] text-center text-[10px] text-muted-foreground">
                    {i % 2 === 0 ? day : ""}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <TooltipProvider key={`${weekIndex}-${dayIndex}`} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[14px] w-[14px] rounded-sm ${
                                day.date ? LEVEL_COLORS[day.level] : "bg-transparent"
                              } ${day.date ? "cursor-pointer transition-transform hover:scale-110" : ""}`}
                            />
                          </TooltipTrigger>
                          {day.date && (
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-medium">{formatDate(day.date)}</div>
                              <div className="text-muted-foreground">
                                {formatHours(day.focusHours)} focus
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

          {/* Compact Legend */}
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              Total:{" "}
              <span className="font-semibold text-[#E5A853]">
                {formatHours(data.totalFocusHours)}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <div key={level} className={`h-3 w-3 rounded-sm ${LEVEL_COLORS[level]}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full version (for Dashboard if needed)
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#E5A853]" />
            Activity Heatmap
          </CardTitle>
          <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 month</SelectItem>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-[#2B4474]/5 p-3 dark:bg-[#2B4474]/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Total Focus
            </div>
            <div className="mt-1 text-lg font-bold text-[#E5A853]">
              {formatHours(data.totalFocusHours)}
            </div>
          </div>
          <div className="rounded-lg bg-[#2B4474]/5 p-3 dark:bg-[#2B4474]/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Daily Avg
            </div>
            <div className="mt-1 text-lg font-bold text-[#2B4474] dark:text-white">
              {formatHours(data.averageDailyHours)}
            </div>
          </div>
          <div className="rounded-lg bg-[#2B4474]/5 p-3 dark:bg-[#2B4474]/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-3 w-3" />
              Current Streak
            </div>
            <div className="mt-1 text-lg font-bold text-[#2B4474] dark:text-white">
              {data.currentStreak} days
            </div>
          </div>
          <div className="rounded-lg bg-[#2B4474]/5 p-3 dark:bg-[#2B4474]/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              Best Streak
            </div>
            <div className="mt-1 text-lg font-bold text-[#2B4474] dark:text-white">
              {data.longestStreak} days
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {/* Weekday labels */}
            <div className="mb-1 flex">
              <div className="w-8" />
              {WEEKDAYS.map((day) => (
                <div key={day} className="w-4 text-center text-[10px] text-muted-foreground">
                  {day[0]}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <TooltipProvider key={`${weekIndex}-${dayIndex}`} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-3 w-3 rounded-sm ${
                              day.date ? LEVEL_COLORS[day.level] : "bg-transparent"
                            } ${day.date ? "cursor-pointer transition-transform hover:scale-125" : ""}`}
                          />
                        </TooltipTrigger>
                        {day.date && (
                          <TooltipContent side="top" className="text-xs">
                            <div className="font-medium">{formatDate(day.date)}</div>
                            <div className="text-muted-foreground">
                              {formatHours(day.focusHours)} focus time
                            </div>
                            <div className="text-muted-foreground">
                              {day.activityCount} activities
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

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <TooltipProvider key={level} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`h-3 w-3 rounded-sm ${LEVEL_COLORS[level]}`} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {LEVEL_LABELS[level]}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

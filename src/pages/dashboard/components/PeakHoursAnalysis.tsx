/**
 * Peak Hours Analysis - Layer 3: Strategic Analysis
 *
 * Identifies user's most productive hours based on historical data.
 * Helps users optimize their schedule.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRange } from "@/types/time";
import { Sun, Moon, Sunrise, Sunset, Zap } from "lucide-react";

interface PeakHoursAnalysisProps {
  timeRange: TimeRange;
  boardId?: string;
}

interface HourData {
  hour: number;
  totalMinutes: number;
  avgProductivity: number;
}

export function PeakHoursAnalysis({ timeRange, boardId }: PeakHoursAnalysisProps) {
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
    refetchInterval: 60000,
  });

  const analysis = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return null;
    }

    // Aggregate by hour
    const hourlyStats: HourData[] = hourlyData.map((h) => ({
      hour: h.hour,
      totalMinutes: Math.round(h.totalSecondsFocusedTime / 60),
      avgProductivity: 0, // Would need productivity data per hour
    }));

    // Find peak hours (top 3)
    const sorted = [...hourlyStats].sort((a, b) => b.totalMinutes - a.totalMinutes);
    const peakHours = sorted.filter((h) => h.totalMinutes > 0).slice(0, 3);

    // Calculate time of day distribution
    const morning = hourlyStats
      .filter((h) => h.hour >= 6 && h.hour < 12)
      .reduce((sum, h) => sum + h.totalMinutes, 0);
    const afternoon = hourlyStats
      .filter((h) => h.hour >= 12 && h.hour < 17)
      .reduce((sum, h) => sum + h.totalMinutes, 0);
    const evening = hourlyStats
      .filter((h) => h.hour >= 17 && h.hour < 21)
      .reduce((sum, h) => sum + h.totalMinutes, 0);
    const night = hourlyStats
      .filter((h) => h.hour >= 21 || h.hour < 6)
      .reduce((sum, h) => sum + h.totalMinutes, 0);

    const total = morning + afternoon + evening + night;
    const distribution =
      total > 0
        ? {
            morning: Math.round((morning / total) * 100),
            afternoon: Math.round((afternoon / total) * 100),
            evening: Math.round((evening / total) * 100),
            night: Math.round((night / total) * 100),
          }
        : { morning: 0, afternoon: 0, evening: 0, night: 0 };

    // Determine primary work style
    const maxPeriod = Math.max(
      distribution.morning,
      distribution.afternoon,
      distribution.evening,
      distribution.night
    );
    let workStyle = "Balanced";
    if (distribution.morning === maxPeriod && distribution.morning > 40) workStyle = "Early Bird";
    else if (distribution.afternoon === maxPeriod && distribution.afternoon > 40)
      workStyle = "Afternoon Focused";
    else if (distribution.evening === maxPeriod && distribution.evening > 40)
      workStyle = "Evening Worker";
    else if (distribution.night === maxPeriod && distribution.night > 30) workStyle = "Night Owl";

    return { peakHours, distribution, workStyle, hourlyStats };
  }, [hourlyData]);

  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${h}${ampm}`;
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.peakHours.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">
          Not enough data to analyze peak hours
        </CardContent>
      </Card>
    );
  }

  const periodConfig = [
    { key: "morning", label: "Morning", icon: Sunrise, hours: "6AM-12PM", color: "text-amber-500" },
    {
      key: "afternoon",
      label: "Afternoon",
      icon: Sun,
      hours: "12PM-5PM",
      color: "text-yellow-500",
    },
    { key: "evening", label: "Evening", icon: Sunset, hours: "5PM-9PM", color: "text-orange-500" },
    { key: "night", label: "Night", icon: Moon, hours: "9PM-6AM", color: "text-indigo-500" },
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Peak Hours Analysis</CardTitle>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            {analysis.workStyle}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Peak Hours */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Your most productive hours:</p>
          <div className="flex flex-wrap gap-2">
            {analysis.peakHours.map((peak, i) => (
              <div
                key={peak.hour}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="font-medium">{formatHour(peak.hour)}</span>
                <span className="text-xs opacity-80">{formatMinutes(peak.totalMinutes)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Distribution */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Time of day distribution:</p>
          <div className="grid grid-cols-4 gap-2">
            {periodConfig.map((period) => {
              const value = analysis.distribution[period.key];
              const Icon = period.icon;
              return (
                <div key={period.key} className="text-center">
                  <Icon className={`mx-auto h-4 w-4 ${period.color}`} />
                  <div className="mt-1 text-lg font-semibold">{value}%</div>
                  <div className="text-[10px] text-muted-foreground">{period.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hour-by-hour mini chart */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Hourly breakdown (6AM-10PM):</p>
          <div className="flex h-12 items-end gap-0.5">
            {analysis.hourlyStats
              .filter((h) => h.hour >= 6 && h.hour <= 22)
              .map((h) => {
                const maxMins = Math.max(...analysis.hourlyStats.map((x) => x.totalMinutes));
                const height = maxMins > 0 ? (h.totalMinutes / maxMins) * 100 : 0;
                return (
                  <div
                    key={h.hour}
                    className="flex-1 rounded-t bg-primary/60 transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${formatHour(h.hour)}: ${formatMinutes(h.totalMinutes)}`}
                  />
                );
              })}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>10PM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

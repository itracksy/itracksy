/**
 * Focus Trends - Layer 3: Strategic Analysis
 *
 * Line chart showing daily focus time with 7-day moving average.
 * Reveals long-term patterns and trajectory.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRange } from "@/types/time";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FocusTrendsProps {
  timeRange: TimeRange;
  boardId?: string;
}

export function FocusTrends({ timeRange, boardId }: FocusTrendsProps) {
  const { data, isLoading } = useQuery({
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
    refetchInterval: 60000,
  });

  const { chartData, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], stats: { avg: 0, trend: 0, best: 0 } };
    }

    // Calculate 7-day moving average
    const withMovingAvg = data.map((day, i) => {
      const start = Math.max(0, i - 6);
      const slice = data.slice(start, i + 1);
      const movingAvg = slice.reduce((sum, d) => sum + d.totalFocusTime, 0) / slice.length;

      return {
        date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        focusMinutes: Math.round(day.totalFocusTime / 60),
        movingAvg: Math.round(movingAvg / 60),
        productivity: day.productivityPercentage,
      };
    });

    // Calculate stats
    const totalFocus = data.reduce((sum, d) => sum + d.totalFocusTime, 0);
    const avgMinutes = Math.round(totalFocus / 60 / data.length);
    const bestDay = Math.max(...data.map((d) => d.totalFocusTime));

    // Trend: compare last 7 days avg to previous 7 days
    let trend = 0;
    if (data.length >= 14) {
      const recent = data.slice(-7).reduce((sum, d) => sum + d.totalFocusTime, 0) / 7;
      const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.totalFocusTime, 0) / 7;
      if (previous > 0) {
        trend = Math.round(((recent - previous) / previous) * 100);
      }
    }

    return {
      chartData: withMovingAvg,
      stats: { avg: avgMinutes, trend, best: Math.round(bestDay / 60) },
    };
  }, [data]);

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Focus Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
          Not enough data for trends. Keep tracking!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Focus Trends</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-4 rounded bg-primary" />
              <span className="text-muted-foreground">Daily</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-4 bg-orange-500" />
              <span className="text-muted-foreground">7-day avg</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="mb-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Daily Average: </span>
            <span className="font-semibold">{formatMinutes(stats.avg)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Best Day: </span>
            <span className="font-semibold">{formatMinutes(stats.best)}</span>
          </div>
          {stats.trend !== 0 && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Trend: </span>
              <span
                className={`flex items-center font-semibold ${stats.trend > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(stats.trend)}%
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="date"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}m`}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-muted-foreground">
                          Focus:{" "}
                          <span className="font-medium text-primary">
                            {formatMinutes(d.focusMinutes)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          7-day avg:{" "}
                          <span className="font-medium text-orange-500">
                            {formatMinutes(d.movingAvg)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Productivity: <span className="font-medium">{d.productivity}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Daily focus bars/line */}
              <Line
                type="monotone"
                dataKey="focusMinutes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
              {/* 7-day moving average */}
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

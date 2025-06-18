import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TimeRange } from "@/types/time";
import { PlayCircle, Calendar, TrendingUp, Clock } from "lucide-react";
import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeriodType = "daily" | "weekly" | "monthly";
type ChartType = "line" | "bar";

interface FocusPerformanceChartProps {
  timeRange: TimeRange;
}

interface FocusPerformanceData {
  date: string;
  totalFocusTime: number;
  productiveTime: number;
  totalSessions: number;
  productivityPercentage: number;
  averageSessionDuration: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string, period: PeriodType): string {
  const date = new Date(dateStr);

  switch (period) {
    case "daily":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "weekly":
      const endOfWeek = new Date(date);
      endOfWeek.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "monthly":
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    default:
      return dateStr;
  }
}

export default function FocusPerformanceChart({ timeRange }: FocusPerformanceChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [chartType, setChartType] = useState<ChartType>("line");

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["dashboard.getFocusPerformanceByPeriod", timeRange.start, timeRange.end, period],
    queryFn: async () => {
      const data = await trpcClient.dashboard.getFocusPerformanceByPeriod.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        period,
      });
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const chartData = useMemo(() => {
    if (!performanceData) return [];

    return performanceData.map((item: FocusPerformanceData) => ({
      date: item.date,
      formattedDate: formatDate(item.date, period),
      focusTime: Math.round(item.totalFocusTime / 60), // Convert to minutes
      productiveTime: Math.round(item.productiveTime / 60), // Convert to minutes
      sessions: item.totalSessions,
      productivity: item.productivityPercentage,
      avgSession: Math.round(item.averageSessionDuration / 60), // Convert to minutes
    }));
  }, [performanceData, period]);

  const stats = useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return {
        totalFocusTime: 0,
        averageProductivity: 0,
        totalSessions: 0,
        bestDay: null,
      };
    }

    const totalFocusTime = performanceData.reduce((sum, item) => sum + item.totalFocusTime, 0);
    const totalProductiveTime = performanceData.reduce((sum, item) => sum + item.productiveTime, 0);
    const totalSessions = performanceData.reduce((sum, item) => sum + item.totalSessions, 0);
    const averageProductivity =
      totalFocusTime > 0 ? Math.round((totalProductiveTime / totalFocusTime) * 100) : 0;

    const bestDay = performanceData.reduce(
      (best, current) => {
        return current.totalFocusTime > (best?.totalFocusTime || 0) ? current : best;
      },
      null as FocusPerformanceData | null
    );

    return {
      totalFocusTime,
      averageProductivity,
      totalSessions,
      bestDay,
    };
  }, [performanceData]);

  const hasData = chartData && chartData.length > 0 && stats.totalFocusTime > 0;

  if (isLoading) {
    return (
      <Card className="col-span-full border-[#E5A853]/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-[#2B4474] dark:text-white">Focus Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading performance data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <TimeEntryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <Card className="col-span-full border-[#E5A853]/20 shadow-md">
        <CardHeader className="bg-[#2B4474]/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[#2B4474] dark:text-white">
              <TrendingUp className="h-5 w-5 text-[#E5A853]" />
              Focus Performance Trends
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                <SelectTrigger className="w-32 border-[#E5A853]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                <SelectTrigger className="w-24 border-[#E5A853]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasData && (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <Clock className="h-4 w-4 text-[#E5A853]" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Focus Time</p>
                  <p className="font-semibold text-[#2B4474] dark:text-white">
                    {formatDuration(stats.totalFocusTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <TrendingUp className="h-4 w-4 text-[#E5A853]" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Productivity</p>
                  <p className="font-semibold text-[#2B4474] dark:text-white">
                    {stats.averageProductivity}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <Calendar className="h-4 w-4 text-[#E5A853]" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                  <p className="font-semibold text-[#2B4474] dark:text-white">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <PlayCircle className="h-4 w-4 text-[#E5A853]" />
                <div>
                  <p className="text-xs text-muted-foreground">Best Day</p>
                  <p className="font-semibold text-[#2B4474] dark:text-white">
                    {stats.bestDay ? formatDuration(stats.bestDay.totalFocusTime) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {!hasData ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-[#E5A853]/30 bg-[#2B4474]/5 p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#2B4474] dark:text-white">
                  No Focus Data Yet
                </h3>
                <p className="mt-2 text-sm text-[#2B4474]/70 dark:text-gray-300">
                  Start tracking your focus sessions to see your performance trends!
                </p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 bg-[#E5A853] hover:bg-[#d99a3d]"
              >
                <PlayCircle className="h-4 w-4" />
                Start Focus Session
              </Button>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5A853" strokeOpacity={0.1} />
                    <XAxis
                      dataKey="formattedDate"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={period === "daily" ? -45 : 0}
                      textAnchor={period === "daily" ? "end" : "middle"}
                      height={period === "daily" ? 80 : 60}
                    />
                    <YAxis
                      yAxisId="time"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <YAxis
                      yAxisId="percentage"
                      orientation="right"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-[#E5A853]/20 bg-white p-4 shadow-lg dark:bg-gray-800">
                              <p className="mb-2 font-medium text-[#2B4474] dark:text-white">
                                {label}
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Focus Time:</span>
                                  <span className="font-medium text-[#E5A853]">
                                    {data.focusTime}m
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Productive Time:</span>
                                  <span className="font-medium text-green-600">
                                    {data.productiveTime}m
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Sessions:</span>
                                  <span className="font-medium">{data.sessions}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Productivity:</span>
                                  <span className="font-medium text-blue-600">
                                    {data.productivity}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Avg Session:</span>
                                  <span className="font-medium">{data.avgSession}m</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="time"
                      type="monotone"
                      dataKey="focusTime"
                      name="Focus Time (min)"
                      stroke="#E5A853"
                      strokeWidth={3}
                      dot={{ fill: "#E5A853", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#E5A853", strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="time"
                      type="monotone"
                      dataKey="productiveTime"
                      name="Productive Time (min)"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      yAxisId="percentage"
                      type="monotone"
                      dataKey="productivity"
                      name="Productivity %"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5A853" strokeOpacity={0.1} />
                    <XAxis
                      dataKey="formattedDate"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={period === "daily" ? -45 : 0}
                      textAnchor={period === "daily" ? "end" : "middle"}
                      height={period === "daily" ? 80 : 60}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-[#E5A853]/20 bg-white p-4 shadow-lg dark:bg-gray-800">
                              <p className="mb-2 font-medium text-[#2B4474] dark:text-white">
                                {label}
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Focus Time:</span>
                                  <span className="font-medium text-[#E5A853]">
                                    {data.focusTime}m
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Productive Time:</span>
                                  <span className="font-medium text-green-600">
                                    {data.productiveTime}m
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Sessions:</span>
                                  <span className="font-medium">{data.sessions}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">Productivity:</span>
                                  <span className="font-medium text-blue-600">
                                    {data.productivity}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="focusTime"
                      name="Focus Time (min)"
                      fill="#E5A853"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="productiveTime"
                      name="Productive Time (min)"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

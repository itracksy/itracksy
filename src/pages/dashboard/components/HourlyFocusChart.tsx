import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";
import { TimeRange } from "@/types/time";

interface HourlyFocusChartProps {
  timeRange: TimeRange;
}

export default function HourlyFocusChart({ timeRange }: HourlyFocusChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour"],
    queryFn: async () => {
      const data = await trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
      });

      return data;
    },
    refetchInterval: 10000,
  });

  type FormatedData = {
    hour: string;
    focusedTime: number;
    breakTime: number;
    activities: {
      title: string;
      duration: number;
      ownerName: string;
      isFocusMode: boolean;
    }[];
  };

  const formattedData =
    hourlyData?.map((item) => ({
      hour: `${item.hour}:00`,
      focusedTime: Math.round(item.totalSecondsFocusedTime / 60), // Convert to minutes
      breakTime: Math.round(item.totalSecondsBreakTime / 60), // Convert to minutes
      activities: item.activities,
    })) ?? [];

  const hasData =
    formattedData && formattedData.some((item) => item.focusedTime > 0 || item.breakTime > 0);

  return (
    <>
      <TimeEntryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Hourly Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : !hasData ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">No Activity Recorded</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ready to boost your productivity? Start tracking your work time!
                </p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <PlayCircle className="h-4 w-4" />
                Start Working
              </Button>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <XAxis
                    dataKey="hour"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}m`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data: FormatedData = payload[0].payload;
                        return (
                          <div
                            className="max-h-[400px] overflow-auto rounded-lg border bg-background p-4 shadow-sm"
                            style={{ minWidth: "300px" }}
                          >
                            <div className="grid gap-2">
                              <div className="sticky top-0 flex items-center justify-between gap-2 border-b bg-background py-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Time
                                  </span>
                                  <span className="font-bold">{data.hour}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex gap-2">
                                    <div className="flex items-center">
                                      <div className="mr-1 h-3 w-3 rounded-full bg-primary"></div>
                                      <span className="font-bold">{data.focusedTime}m</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="mr-1 h-3 w-3 rounded-full bg-secondary"></div>
                                      <span className="font-bold">{data.breakTime}m</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {data.activities && data.activities.length > 0 && (
                                <div>
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Activities
                                  </span>
                                  <div className="mt-2 space-y-3">
                                    {data.activities.map((activity, i) => (
                                      <div key={i} className="flex flex-row justify-between gap-1">
                                        <div className="line-clamp-2 text-sm font-medium">
                                          {activity.title}
                                        </div>
                                        <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                                          <span className="max-w-[180px] truncate">
                                            {activity.ownerName}
                                          </span>
                                          <div className="flex items-center">
                                            <div
                                              className={`mr-1 h-2 w-2 rounded-full ${activity.isFocusMode ? "bg-primary" : "bg-secondary"}`}
                                            ></div>
                                            <span className="font-medium">
                                              {activity.duration < 60
                                                ? `${activity.duration}s`
                                                : `${Math.round(activity.duration / 60)}m`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="focusedTime"
                    name="Focus Time"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                  <Bar
                    dataKey="breakTime"
                    name="Break Time"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-secondary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { startOfDay } from "date-fns";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function HourlyFocusChart() {
  const { data: hourlyData } = useQuery({
    queryKey: ["activityWindow"],
    queryFn: async () => {
      const start = startOfDay(new Date()).getTime();
      const data = await trpcClient.activity.getFocusedTimeByHour.query({ date: start });
      return data;
    },
    refetchInterval: 10000,
  });

  const formattedData =
    hourlyData?.map((item) => ({
      hour: `${item.hour}:00`,
      focusedTime: Math.round(item.totalFocusedTime / (1000 * 60)), // Convert to minutes
    })) ?? [];

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Hourly Focus Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
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
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Time
                          </span>
                          <span className="font-bold">{payload[0].payload.hour}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Focus
                          </span>
                          <span className="font-bold">{payload[0].value}m</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="focusedTime"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

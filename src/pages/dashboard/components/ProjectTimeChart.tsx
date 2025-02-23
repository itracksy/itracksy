import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { TimeRange } from "./TimeRangeSelector";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { useTimeEntryDialog } from "@/hooks/useTimeEntryDialog";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// Generate a vibrant color palette for the pie chart
const COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Turquoise
  "#45B7D1", // Sky Blue
  "#96CEB4", // Mint
  "#FFEEAD", // Cream Yellow
  "#D4A5A5", // Dusty Rose
  "#9B5DE5", // Purple
  "#00BBF9", // Bright Blue
  "#00F5D4", // Aqua
  "#FEE440", // Yellow
  "#F15BB5", // Pink
  "#FB5607", // Orange
  "#3A86FF", // Royal Blue
  "#8338EC", // Violet
];

interface ProjectTimeChartProps {
  timeRange: TimeRange;
}

export default function ProjectTimeChart({ timeRange }: ProjectTimeChartProps) {
  const { data: report } = useQuery({
    queryKey: ["dashboard.reportProjectByDay", timeRange.start, timeRange.end],
    queryFn: async () => {
      const data = await trpcClient.dashboard.reportProjectByDay.query({
        startDate: timeRange.start.getTime(),
        endDate: timeRange.end.getTime(),
      });
      return data;
    },
  });

  const { openDialog } = useTimeEntryDialog();

  const chartData = useMemo(() => {
    if (!report) return [];

    return report.projects.map((project) => ({
      name: project.boardName,
      value: project.totalDuration,
      displayDuration: formatDuration(project.totalDuration),
      tasks: project.tasks.map((task) => ({
        name: task.itemTitle,
        duration: formatDuration(task.duration),
      })),
    }));
  }, [report]);

  const hasData = chartData && chartData.length > 0;

  if (!report) {
    return null;
  }

  const totalDuration = formatDuration(report.totalDuration);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Time ({timeRange.start.toLocaleDateString()} - {timeRange.end.toLocaleDateString()})</span>
          <span className="text-sm font-normal text-muted-foreground">{totalDuration} total</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex h-[400px]">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "var(--muted-foreground)", strokeWidth: 0.5 }}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                      stroke="var(--background)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    const data = payload[0].payload;
                    const color =
                      COLORS[chartData.findIndex((item) => item.name === data.name) % COLORS.length];

                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                          <p className="font-medium">{data.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{data.displayDuration}</p>
                        <div className="mt-2">
                          <p className="text-xs font-medium">Tasks:</p>
                          {data.tasks.map((task: any) => (
                            <p key={task.name} className="text-xs text-muted-foreground">
                              {task.name}: {task.duration}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] overflow-auto pl-4">
              <h3 className="mb-2 font-medium">Project Breakdown</h3>
              {chartData.map((project, index) => (
                <div key={project.name} className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{project.displayDuration}</span>
                  </div>
                  <div className="ml-5 mt-1">
                    {project.tasks.map((task) => (
                      <div
                        key={task.name}
                        className="flex justify-between text-sm text-muted-foreground"
                      >
                        <span>{task.name}</span>
                        <span>{task.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-[400px] flex-col items-center justify-center gap-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Projects Tracked Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Track time on your projects to see your progress here!
              </p>
            </div>
            <Button onClick={openDialog} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Start Working
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

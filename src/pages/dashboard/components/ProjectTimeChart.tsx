import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { TimeRange } from "@/types/time";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// Generate a color palette that complements the brand colors
const COLORS = [
  "#E5A853", // Primary gold
  "#2B4474", // Secondary deep blue
  "#5D7EB8", // Lighter blue
  "#F0BC74", // Lighter gold
  "#1D2F4F", // Darker blue
  "#CB9036", // Darker gold
  "#7593C6", // Even lighter blue
  "#F5CA8F", // Even lighter gold
  "#A37229", // Brown-gold
  "#3E5E9E", // Medium blue
  "#FFD699", // Pale gold
  "#8BAAD6", // Pale blue
  "#D99C41", // Medium gold
  "#496BA9", // Medium-light blue
];

// Define types for chart data
type TaskChartItem = {
  name: string;
  value: number;
  displayDuration: string;
  projectName: string;
  isTask: boolean;
};

type ProjectChartItem = {
  name: string;
  value: number;
  displayDuration: string;
  tasks: { name: string; duration: string }[];
};

type ChartDataItem = TaskChartItem | ProjectChartItem;

// Type guard function to check if an item is a ProjectChartItem
function isProjectChartItem(item: ChartDataItem): item is ProjectChartItem {
  return "tasks" in item;
}

interface ProjectTimeChartProps {
  timeRange: TimeRange;
}

export default function ProjectTimeChart({ timeRange }: ProjectTimeChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: report } = useQuery({
    queryKey: ["dashboard.reportProjectByDay", timeRange.start, timeRange.end],
    queryFn: async () => {
      const data = await trpcClient.dashboard.reportProjectByDay.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
      });
      return data;
    },
  });

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!report) return [];

    // If there's only one project, show tasks with different colors
    if (report.projects.length === 1) {
      const project = report.projects[0];
      return project.tasks.map(
        (task): TaskChartItem => ({
          name: task.title,
          value: task.duration,
          displayDuration: formatDuration(task.duration),
          projectName: project.name,
          isTask: true,
        })
      );
    }

    // Normal case - multiple projects
    return report.projects.map(
      (project): ProjectChartItem => ({
        name: project.name,
        value: project.totalDuration,
        displayDuration: formatDuration(project.totalDuration),
        tasks: project.tasks.map((task) => ({
          name: task.title,
          duration: formatDuration(task.duration),
        })),
      })
    );
  }, [report]);

  const hasData = chartData && chartData.length > 0;

  if (!report) {
    return null;
  }

  const totalDuration = formatDuration(report.totalDuration);

  return (
    <>
      <TimeEntryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <Card className="col-span-full border-[#E5A853]/20 shadow-md">
        <CardHeader className="bg-[#2B4474]/5 pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-[#2B4474] dark:text-white">Project Time</span>
            <span className="rounded-full bg-[#E5A853] px-3 py-1 text-sm font-medium text-white">
              {totalDuration} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {hasData ? (
            <div className="flex h-[300px]">
              <ResponsiveContainer width="60%" height="110%">
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
                    labelLine={{ stroke: "#2B4474", strokeWidth: 0.5, strokeOpacity: 0.5 }}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;

                      const data = payload[0].payload;
                      const color =
                        COLORS[
                          chartData.findIndex((item) => item.name === data.name) % COLORS.length
                        ];

                      return (
                        <div className="rounded-lg border border-[#E5A853]/20 bg-white p-3 shadow-lg dark:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <p className="font-medium text-[#2B4474] dark:text-white">
                              {data.name}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-[#E5A853] dark:text-[#F0BC74]">
                            {data.displayDuration}
                          </p>
                          {isProjectChartItem(data) && (
                            <div className="mt-2 border-t border-[#E5A853]/10 pt-2">
                              <p className="text-xs font-medium text-[#2B4474] dark:text-white">
                                Tasks:
                              </p>
                              {data.tasks.map((task) => (
                                <p
                                  key={task.name}
                                  className="text-xs text-[#2B4474]/70 dark:text-gray-300"
                                >
                                  {task.name}:{" "}
                                  <span className="text-[#E5A853] dark:text-[#F0BC74]">
                                    {task.duration}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] overflow-auto pl-4">
                <h3 className="mb-3 font-medium text-[#2B4474] dark:text-white">
                  Project Breakdown
                </h3>
                {chartData.map((project, index) => (
                  <div
                    key={project.name}
                    className="mb-4 rounded-md border border-[#E5A853]/10 p-2 transition-all hover:border-[#E5A853]/30 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-[#2B4474] dark:text-white">
                          {project.name}
                        </span>
                      </div>
                      <span className="rounded-md bg-[#E5A853]/10 px-2 py-0.5 text-sm font-medium text-[#E5A853]">
                        {project.displayDuration}
                      </span>
                    </div>
                    <div className="ml-5 mt-2">
                      {isProjectChartItem(project) &&
                        project.tasks.map((task) => (
                          <div key={task.name} className="flex justify-between text-sm">
                            <span className="text-[#2B4474]/80 dark:text-gray-300">
                              {task.name}
                            </span>
                            <span className="text-[#E5A853]/80">{task.duration}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-[#E5A853]/30 bg-[#2B4474]/5 p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#2B4474] dark:text-white">
                  No Projects Tracked Yet
                </h3>
                <p className="mt-2 text-sm text-[#2B4474]/70 dark:text-gray-300">
                  Track time on your projects to see your progress here!
                </p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 bg-[#E5A853] hover:bg-[#d99a3d]"
              >
                <PlayCircle className="h-4 w-4" />
                Start Working
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

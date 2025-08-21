import { useState } from "react";
import { Calendar, Download, Filter, Search } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "@/hooks/use-toast";
import { TimeRange } from "@/types/time";

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date().setHours(0, 0, 0, 0),
    end: new Date().setHours(23, 59, 59, 999),
    value: "today",
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const data = await trpcClient.board.list.query();
      return data;
    },
  });

  // Fetch preview data based on filters
  const { data: previewData = [], refetch: refetchPreview } = useQuery({
    queryKey: ["timeEntries", "preview", selectedProject, timeRange],
    queryFn: async () => {
      const startDate = new Date(timeRange.start).toISOString();
      const endDate = new Date(timeRange.end).toISOString();

      const data = await trpcClient.timeEntry.exportCsv.query({
        startDate,
        endDate,
      });

      // Filter by project if not "all"
      if (selectedProject !== "all") {
        return data.filter((entry: any) => entry.boardId === selectedProject);
      }

      return data;
    },
    enabled: true,
  });
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    // Define CSV headers
    const headers = [
      "Date",
      "Start Time",
      "End Time",
      "Duration (Hours)",
      "Client/Project",
      "Task",
      "Description",
      "Categories/Tags",
      "Mode",
      "Productivity %",
    ];

    // Convert data rows
    const rows = data.map((entry: any) => {
      const startDate = new Date(entry.startTime);
      const endDate = entry.endTime ? new Date(entry.endTime) : null;
      const durationHours = entry.duration ? (entry.duration / 3600).toFixed(2) : "0.00";

      return [
        format(startDate, "yyyy-MM-dd"),
        format(startDate, "HH:mm:ss"),
        endDate ? format(endDate, "HH:mm:ss") : "Running",
        durationHours,
        entry.boardName || "No Project",
        entry.itemTitle || "No Task",
        entry.description || "",
        entry.categoriesUsed || "",
        entry.isFocusMode ? "Focus" : "Break",
        `${entry.productivityPercentage || 0}%`,
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${field?.toString().replace(/"/g, '""') || ""}"`).join(",")
      )
      .join("\n");

    return csvContent;
  };

  const handleExport = async () => {
    if (previewData.length === 0) {
      toast({
        title: "No Data",
        description: "No time entries found for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const csvContent = convertToCSV(previewData);

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        // Generate filename
        const projectName =
          selectedProject === "all"
            ? "all-projects"
            : projects.find((p: any) => p.id === selectedProject)?.name || "project";
        const dateStr =
          format(new Date(timeRange.start), "yyyy-MM-dd") +
          "_to_" +
          format(new Date(timeRange.end), "yyyy-MM-dd");

        link.setAttribute("download", `time-entries_${projectName}_${dateStr}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${previewData.length} time entries to CSV.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export time entries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const totalDuration = previewData.reduce(
    (sum: number, entry: any) => sum + (entry.duration || 0),
    0
  );
  const averageProductivity =
    previewData.length > 0
      ? Math.round(
          previewData.reduce(
            (sum: number, entry: any) => sum + (entry.productivityPercentage || 0),
            0
          ) / previewData.length
        )
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-2 text-muted-foreground">
            Export time entries with detailed project and productivity information
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || previewData.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Select the project and date range for your export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <TimeRangeSelector
                start={timeRange.start}
                end={timeRange.end}
                value={timeRange.value}
                onRangeChange={setTimeRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{previewData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProductivity}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Preview of {previewData.length} time entries that will be exported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b bg-background">
                  <tr>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Project</th>
                    <th className="p-3 text-left font-medium">Task</th>
                    <th className="p-3 text-left font-medium">Duration</th>
                    <th className="p-3 text-left font-medium">Mode</th>
                    <th className="p-3 text-left font-medium">Productivity</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No time entries found for the selected filters.
                        <br />
                        Try adjusting your project or date range selection.
                      </td>
                    </tr>
                  ) : (
                    previewData.map((entry: any, index: number) => (
                      <tr key={entry.id} className="border-b">
                        <td className="p-3">{format(new Date(entry.startTime), "MMM d, yyyy")}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {entry.boardColor && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.boardColor }}
                              />
                            )}
                            {entry.boardName || "No Project"}
                          </div>
                        </td>
                        <td className="p-3">{entry.itemTitle || entry.description || "No Task"}</td>
                        <td className="p-3">{formatDuration(entry.duration || 0)}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              entry.isFocusMode
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {entry.isFocusMode ? "Focus" : "Break"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${entry.productivityPercentage || 0}%` }}
                              />
                            </div>
                            <span className="w-8 text-xs text-muted-foreground">
                              {entry.productivityPercentage || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

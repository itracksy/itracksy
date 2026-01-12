import { useState, useMemo } from "react";
import { Download, Plus, Clock, Target, Hash, Brain } from "lucide-react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "@/hooks/use-toast";
import { TimeRange } from "@/types/time";
import { ManualFocusEntryDialog } from "@/components/tracking/ManualFocusEntryDialog";

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date().setHours(0, 0, 0, 0),
    end: new Date().setHours(23, 59, 59, 999),
    value: "today",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  const handleManualEntryClose = (open: boolean) => {
    setIsManualEntryOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["timeEntries", "preview"] });
    }
  };

  const { data: projects = [] } = useQuery({
    queryKey: ["boards"],
    queryFn: () => trpcClient.board.list.query(),
  });

  const { data: previewData = [] } = useQuery({
    queryKey: ["timeEntries", "preview", selectedProject, timeRange],
    queryFn: async () => {
      const startDate = new Date(timeRange.start).toISOString();
      const endDate = new Date(timeRange.end).toISOString();
      const data = await trpcClient.timeEntry.exportCsv.query({ startDate, endDate });
      if (selectedProject !== "all") {
        return data.filter((entry: any) => entry.boardId === selectedProject);
      }
      return data;
    },
  });

  const stats = useMemo(() => {
    const totalDuration = previewData.reduce(
      (sum: number, entry: any) => sum + (entry.duration || 0),
      0
    );
    const avgProductivity =
      previewData.length > 0
        ? Math.round(
            previewData.reduce(
              (sum: number, entry: any) => sum + (entry.productivityPercentage || 0),
              0
            ) / previewData.length
          )
        : 0;
    return { totalDuration, avgProductivity, count: previewData.length };
  }, [previewData]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";
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
    return [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${field?.toString().replace(/"/g, '""') || ""}"`).join(",")
      )
      .join("\n");
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
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
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

  return (
    <div className="flex h-full flex-col">
      <ManualFocusEntryDialog open={isManualEntryOpen} onOpenChange={handleManualEntryClose} />

      {/* Header with filters */}
      <div className="border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Reports</h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filters inline */}
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All Projects" />
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

            <TimeRangeSelector
              start={timeRange.start}
              end={timeRange.end}
              value={timeRange.value}
              onRangeChange={setTimeRange}
            />

            <div className="h-6 w-px bg-border" />

            <Button variant="outline" size="sm" onClick={() => setIsManualEntryOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Time
            </Button>

            <Link to="/reports/ai-export">
              <Button variant="outline" size="sm">
                <Brain className="mr-1.5 h-4 w-4 text-purple-500" />
                AI Export
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting || previewData.length === 0}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="font-medium text-foreground">{stats.count}</span> entries
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {formatDuration(stats.totalDuration)}
            </span>{" "}
            total
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="font-medium text-foreground">{stats.avgProductivity}%</span> avg
            productivity
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Project</th>
              <th className="px-4 py-3 text-left font-medium">Task</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Productivity</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {previewData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No time entries found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              previewData.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(entry.startTime), "MMM d")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.boardColor && (
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.boardColor }}
                        />
                      )}
                      <span className={entry.boardName ? "" : "text-muted-foreground"}>
                        {entry.boardName || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          entry.isFocusMode ? "bg-green-500" : "bg-blue-500"
                        }`}
                        title={entry.isFocusMode ? "Focus" : "Break"}
                      />
                      <span className={entry.itemTitle ? "" : "text-muted-foreground"}>
                        {entry.itemTitle || entry.description || "Focus Session"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatDuration(entry.duration || 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${entry.productivityPercentage || 0}%` }}
                        />
                      </div>
                      <span className="w-8 tabular-nums text-muted-foreground">
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
  );
}

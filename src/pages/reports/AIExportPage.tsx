import { useState } from "react";
import {
  Download,
  Brain,
  ArrowLeft,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  ArrowLeftRight,
  Target,
  Loader2,
  Copy,
  Check,
  FileJson,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "@/hooks/use-toast";
import { TimeRange } from "@/types/time";
import type { AIExportData } from "@/api/services/aiExport";

export default function AIExportPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0), // Last 7 days
    end: new Date().setHours(23, 59, 59, 999),
    value: "week",
  });
  const [exportType, setExportType] = useState<"full" | "compact">("compact");
  const [copied, setCopied] = useState(false);

  const {
    data: exportData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["aiExport", timeRange, exportType],
    queryFn: async () => {
      const startDate = new Date(timeRange.start).toISOString();
      const endDate = new Date(timeRange.end).toISOString();

      if (exportType === "compact") {
        return trpcClient.timeEntry.exportForAICompact.query({ startDate, endDate });
      }
      return trpcClient.timeEntry.exportForAI.query({ startDate, endDate });
    },
    enabled: false, // Don't auto-fetch
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const handleExport = () => {
    refetch();
  };

  const handleDownload = () => {
    if (!exportData) return;

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr =
      format(new Date(timeRange.start), "yyyy-MM-dd") +
      "_to_" +
      format(new Date(timeRange.end), "yyyy-MM-dd");
    link.download = `deep-work-analysis_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "JSON file has been downloaded.",
    });
  };

  const handleCopy = async () => {
    if (!exportData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "You can now paste this into your AI assistant.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Deep Work Analysis Export
            </h1>
            <p className="text-sm text-muted-foreground">
              Export your focus data for AI analysis of productivity patterns
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Settings</CardTitle>
              <CardDescription>Select date range and export type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <TimeRangeSelector
                  start={timeRange.start}
                  end={timeRange.end}
                  value={timeRange.value}
                  onRangeChange={setTimeRange}
                />

                <div className="h-8 w-px bg-border" />

                <Tabs
                  value={exportType}
                  onValueChange={(v) => setExportType(v as "full" | "compact")}
                >
                  <TabsList>
                    <TabsTrigger value="compact" className="gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Compact
                    </TabsTrigger>
                    <TabsTrigger value="full" className="gap-1.5">
                      <FileJson className="h-3.5 w-3.5" />
                      Full
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button onClick={handleExport} disabled={isFetching}>
                  {isFetching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="mr-2 h-4 w-4" />
                  )}
                  Generate Export
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {exportType === "compact"
                  ? "Compact: Smaller file size, includes metrics and summaries without detailed activity logs. Best for LLM context windows."
                  : "Full: Complete export with all activity details, context switches, and focus streaks. Larger file size."}
              </p>
            </CardContent>
          </Card>

          {/* Summary Preview */}
          {exportData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Summary</CardTitle>
                  <CardDescription>
                    {exportData.dateRange.startDate} to {exportData.dateRange.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Focus Time
                      </div>
                      <p className="text-lg font-semibold">
                        {formatDuration(exportData.summary.totalFocusTimeSeconds)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        Productivity
                      </div>
                      <p className="text-lg font-semibold">
                        {exportData.summary.averageProductivityScore}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Context Switches
                      </div>
                      <p className="text-lg font-semibold">
                        {exportData.summary.totalContextSwitches}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Deep Work Blocks
                      </div>
                      <p className="text-lg font-semibold">
                        {exportData.summary.deepWorkBlocksCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span>
                        <strong>{exportData.summary.totalSessions}</strong> sessions
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span>
                        <strong>{exportData.summary.totalFocusSessions}</strong> focus
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span>
                        <strong>{exportData.summary.totalBreakSessions}</strong> breaks
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span>
                        Longest streak:{" "}
                        <strong>
                          {formatDuration(exportData.summary.longestFocusStreakSeconds)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Stats Preview */}
              {exportData.dailyStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {exportData.dailyStats.slice(0, 7).map((day) => (
                        <div
                          key={day.date}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-24 text-sm font-medium">{day.date}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(day.totalFocusTimeSeconds)} focus
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                              {day.contextSwitchCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              {day.deepWorkBlocksCount} deep
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-16 rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-green-500"
                                  style={{ width: `${day.productivityScore}%` }}
                                />
                              </div>
                              <span className="w-8 text-xs">{day.productivityScore}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {exportData.dailyStats.length > 7 && (
                        <p className="text-center text-xs text-muted-foreground">
                          + {exportData.dailyStats.length - 7} more days in export
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Data</CardTitle>
                  <CardDescription>Download or copy the JSON data for AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                    <Button variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Sample AI Prompts:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>"Analyze my deep work patterns and identify when I'm most productive"</li>
                      <li>
                        "What are my biggest context switching triggers and how can I reduce them?"
                      </li>
                      <li>
                        "Compare my productivity across different days and suggest improvements"
                      </li>
                      <li>"Identify my focus streaks and what apps help me stay in flow state"</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* JSON Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">JSON Preview</CardTitle>
                  <CardDescription>First 2000 characters of export</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
                    {JSON.stringify(exportData, null, 2).slice(0, 2000)}
                    {JSON.stringify(exportData, null, 2).length > 2000 && "\n..."}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}

          {/* Empty State */}
          {!exportData && !isLoading && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Ready to Export</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a date range and click "Generate Export" to create your AI analysis data.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Download,
  Brain,
  Clock,
  Zap,
  ArrowLeftRight,
  Target,
  Loader2,
  Copy,
  Check,
  FileJson,
  Info,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "@/hooks/use-toast";
import { TimeRange } from "@/types/time";
import { DailyDashboard } from "./DailyDashboard";

interface AIAnalysisProps {
  timeRange: TimeRange;
  boardId?: string;
}

export function AIAnalysis({ timeRange, boardId }: AIAnalysisProps) {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<"full" | "compact">("compact");
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "export">("dashboard");

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
    enabled: false,
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

    const prompt = `Analyze my productivity and deep work patterns from this data export. Please provide insights on:

1. **Context Switching Analysis**: Identify my biggest context switching triggers and their cognitive cost. Which app transitions are most frequent?

2. **Deep Work Assessment**: Evaluate my deep work blocks (sessions over 25 minutes with fewer than 3 macro switches). When do I achieve flow state?

3. **Productivity Patterns**: What are my most and least productive days/times? Are there patterns I should be aware of?

4. **Focus Streaks**: Analyze my longest focus streaks. What apps help me stay focused?

5. **Actionable Recommendations**: Based on my data, suggest 3-5 specific changes I can make to improve my deep work time.

Here is my productivity data from ${exportData.dateRange.startDate} to ${exportData.dateRange.endDate}:

\`\`\`json
${JSON.stringify(exportData, null, 2)}
\`\`\``;

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Prompt and data ready - paste into your AI assistant!",
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
    <div className="space-y-6">
      {/* View Selector */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            AI Export
          </TabsTrigger>
        </TabsList>

        {/* Dashboard View */}
        <TabsContent value="dashboard" className="mt-6">
          <DailyDashboard timeRange={timeRange} boardId={boardId} />
        </TabsContent>

        {/* Export View */}
        <TabsContent value="export" className="mt-6 space-y-6">
          {/* Introduction Section */}
          <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30">
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  AI-Powered Deep Work Analysis
                </h3>
                <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                  Export your productivity data for AI analysis. Get personalized insights on
                  context switching patterns, deep work blocks, and focus optimization strategies.
                </p>
              </div>
            </div>
          </div>

          {/* What We Measure Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ArrowLeftRight className="h-4 w-4 text-orange-500" />
                  Context Switches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Every app switch is detected and classified as <strong>macro</strong> (high
                  cognitive cost), <strong>micro</strong> (quick glance), <strong>tab</strong>{" "}
                  (browser), or <strong>interruption</strong> (messaging apps).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Deep Work Blocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Sessions over 25 minutes with fewer than 3 major app switches. These are your most
                  valuable productivity periods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Focus Streaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Continuous time in the same app (5+ minutes). Your longest streaks show when you
                  achieve true flow state.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-blue-500" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Calculated from time spent on productive vs distracting apps, based on your
                  classification rules.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why It Matters */}
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Why Context Switching Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Research shows it takes an average of <strong>23 minutes</strong> to fully regain
                focus after an interruption. Working in constant switching mode can lower functional
                IQ by <strong>10-15 points</strong>.
              </p>
              <p>
                This export quantifies your switching patterns so AI can identify your biggest
                triggers and suggest improvements.
              </p>
            </CardContent>
          </Card>

          {/* Export Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate Export</CardTitle>
              <CardDescription>
                Choose export type and generate your AI-ready productivity data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
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
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  Generate Export
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {exportType === "compact"
                    ? "Compact mode includes all metrics and summaries without detailed activity logs. Best for AI chat assistants with limited context windows."
                    : "Full mode includes complete activity details, every context switch, and focus streak. Larger file, best for detailed data analysis."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {exportData && (
            <>
              {/* Summary Stats */}
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
                        <Zap className="h-3.5 w-3.5" />
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

              {/* Daily Breakdown */}
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
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Use with AI
                  </CardTitle>
                  <CardDescription>
                    Copy includes a pre-written prompt for comprehensive analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleCopy} className="gap-2">
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy for AI"}
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-medium">The AI prompt will ask for:</p>
                    <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        Context switching triggers
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        Deep work assessment
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        Productivity patterns
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        Focus streak analysis
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        Actionable recommendations
                      </li>
                    </ul>
                  </div>
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
                    Click "Generate Export" to create your AI-ready productivity analysis data.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

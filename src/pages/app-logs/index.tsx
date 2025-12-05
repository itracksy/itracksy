import { useState, useEffect, useMemo } from "react";
import {
  ScrollTextIcon,
  RefreshCw,
  Search,
  X,
  Filter,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpcClient } from "@/utils/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";

interface LogFileInfo {
  content: string;
  path: string | null;
  exists: boolean;
}

type LogLevel = "error" | "warning" | "info" | "debug" | "success" | "other";
type FilterLevel = LogLevel | "all";

interface LogLine {
  line: string;
  className: string;
  level: LogLevel;
  lineNumber: number;
  entryIndex: number; // Index of the log entry this line belongs to
}

interface LogEntry {
  lines: LogLine[];
  level: LogLevel;
  entryIndex: number;
}

const isFilterLevel = (value: string): value is FilterLevel => {
  return ["all", "error", "warning", "info", "debug", "success", "other"].includes(value);
};

export default function LogPage(): React.JSX.Element {
  const [logInfo, setLogInfo] = useState<LogFileInfo>({
    content: "",
    path: null,
    exists: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<FilterLevel>("all");
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const { toast } = useToast();

  // Mutation for clearing log file
  const clearLogFileMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.utils.clearLogFile.mutate();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Log file cleared",
          description: "All log entries have been removed successfully",
        });
        // Reload the log file after clearing
        loadLogFile();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: ("error" in result ? result.error : undefined) || "Failed to clear log file",
        });
      }
      setIsClearingLogs(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear log file",
      });
      setIsClearingLogs(false);
    },
  });

  const loadLogFile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await trpcClient.utils.getLogFileContent.query();
      setLogInfo(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load log file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogFile();
  }, []);

  // Helper function to detect if a line starts a new log entry (has timestamp pattern)
  const isLogEntryStart = (line: string): boolean => {
    // Check for timestamp pattern or JSON log entry with timestamp field
    return /^\{.*"timestamp":\d+/.test(line.trim());
  };

  // Helper function to detect log level from a line
  const detectLogLevel = (line: string): LogLevel => {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes("error") ||
      lowerLine.includes("err:") ||
      lowerLine.includes('"level":"error"') ||
      lowerLine.includes("exception") ||
      lowerLine.includes("fatal")
    ) {
      return "error";
    } else if (
      lowerLine.includes("warn") ||
      lowerLine.includes("warning") ||
      lowerLine.includes('"level":"warn"')
    ) {
      return "warning";
    } else if (
      lowerLine.includes("info") ||
      lowerLine.includes("inf:") ||
      lowerLine.includes('"level":"info"')
    ) {
      return "info";
    } else if (
      lowerLine.includes("debug") ||
      lowerLine.includes("dbg:") ||
      lowerLine.includes('"level":"debug"')
    ) {
      return "debug";
    } else if (lowerLine.includes("success")) {
      return "success";
    }
    return "other";
  };

  // Helper function to get className from log level
  const getClassNameFromLevel = (level: LogLevel): string => {
    switch (level) {
      case "error":
        return "text-red-500 font-medium";
      case "warning":
        return "text-yellow-500 font-medium";
      case "info":
        return "text-blue-500";
      case "debug":
        return "text-gray-400";
      case "success":
        return "text-green-500 font-medium";
      default:
        return "text-muted-foreground";
    }
  };

  // Parse and group log entries (handles multi-line entries)
  const logEntries = useMemo((): LogEntry[] => {
    if (!logInfo.content) return [];

    const lines = logInfo.content.split("\n");
    const entries: LogEntry[] = [];
    let currentEntry: LogLine[] = [];
    let currentEntryLevel: LogLevel = "other";
    let currentEntryIndex = 0;
    let lineNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isEntryStart = isLogEntryStart(line);

      if (isEntryStart && currentEntry.length > 0) {
        // Save previous entry with its index
        entries.push({
          lines: currentEntry,
          level: currentEntryLevel,
          entryIndex: currentEntryIndex,
        });
        // Start a new entry
        currentEntry = [];
        currentEntryIndex++;
      }

      if (isEntryStart) {
        // Start of a new entry - detect level from first line
        currentEntryLevel = detectLogLevel(line);
      }

      // Add line to current entry (all lines share the entry's level and index)
      const className = getClassNameFromLevel(currentEntryLevel);

      currentEntry.push({
        line,
        className,
        level: currentEntryLevel, // All lines in entry share the same level
        lineNumber: lineNumber++,
        entryIndex: currentEntryIndex, // All lines in entry share the same index
      });
    }

    // Don't forget the last entry
    if (currentEntry.length > 0) {
      entries.push({
        lines: currentEntry,
        level: currentEntryLevel,
        entryIndex: currentEntryIndex,
      });
    }

    return entries;
  }, [logInfo.content]);

  // Flatten entries to lines for display
  const parsedContent = useMemo((): LogLine[] => {
    return logEntries.flatMap((entry) => entry.lines);
  }, [logEntries]);

  // Filter content based on search and log level (preserving multi-line entries)
  const filteredContent = useMemo(() => {
    // First, filter entries (not individual lines) based on level and search
    let filteredEntries = logEntries;

    // Filter by log level - include entire entry if level matches
    if (selectedLevel !== "all") {
      filteredEntries = filteredEntries.filter((entry) => entry.level === selectedLevel);
    }

    // Filter by search term - include entire entry if any line matches
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter((entry) =>
        entry.lines.some((logLine) => logLine.line.toLowerCase().includes(searchLower))
      );
    }

    // Flatten filtered entries back to lines
    let filtered = filteredEntries.flatMap((entry) => entry.lines);

    // Add search highlight to filtered content
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.map((logLine) => ({
        ...logLine,
        className: logLine.line.toLowerCase().includes(searchLower)
          ? `${logLine.className} bg-yellow-500/20`
          : logLine.className,
      }));
    }

    return filtered;
  }, [logEntries, searchTerm, selectedLevel]);

  // Get filtered log text for copy/download
  const filteredLogText = useMemo(() => {
    return filteredContent.map(({ line }) => line).join("\n");
  }, [filteredContent]);

  // Count log levels for statistics (count entries, not lines)
  const logLevelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
      success: 0,
      other: 0,
    };

    logEntries.forEach((entry) => {
      counts[entry.level]++;
    });

    return counts;
  }, [logEntries]);

  const handleCopyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(filteredLogText);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Log content copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const handleDownloadLog = (): void => {
    const blob = new Blob([filteredLogText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itracksy-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Log file downloaded successfully",
    });
  };

  const toggleLineExpansion = (lineNumber: number): void => {
    setExpandedLines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  };

  const handleClearFilters = (): void => {
    setSearchTerm("");
    setSelectedLevel("all");
    setExpandedLines(new Set());
    toast({
      title: "Filters cleared",
      description: "All filters and search have been reset",
    });
  };

  const handleResetLogFile = (): void => {
    setIsClearingLogs(true);
    clearLogFileMutation.mutate();
  };

  const logLevelConfig = [
    { level: "all" as const, label: "All Logs", color: "text-foreground" },
    {
      level: "error" as const,
      label: "Error",
      color: "text-red-500",
      count: logLevelCounts.error,
    },
    {
      level: "warning" as const,
      label: "Warning",
      color: "text-yellow-500",
      count: logLevelCounts.warning,
    },
    {
      level: "info" as const,
      label: "Info",
      color: "text-blue-500",
      count: logLevelCounts.info,
    },
    {
      level: "success" as const,
      label: "Success",
      color: "text-green-500",
      count: logLevelCounts.success,
    },
    {
      level: "debug" as const,
      label: "Debug",
      color: "text-gray-400",
      count: logLevelCounts.debug,
    },
    {
      level: "other" as const,
      label: "Other",
      color: "text-muted-foreground",
      count: logLevelCounts.other,
    },
  ];

  const isFiltered = selectedLevel !== "all";
  const isSearchActive = searchTerm.length > 0;

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <Card className="border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ScrollTextIcon className="h-5 w-5" />
                Application Logs
              </CardTitle>
              {logInfo.path && (
                <CardDescription className="font-mono text-xs">{logInfo.path}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadLogFile} disabled={isLoading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>

              {/* Reset Log File Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isClearingLogs || isLoading}
                    className="gap-2"
                  >
                    <Trash2 className={cn("h-4 w-4", isClearingLogs && "animate-pulse")} />
                    Reset Log File
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Log File</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all log entries? This action cannot be undone.
                      All log data will be permanently removed from the log file.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetLogFile}
                      disabled={isClearingLogs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isClearingLogs ? "Clearing..." : "Clear Log File"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {logLevelConfig.map(({ level, label, count }) => {
              if (level === "all") return null;
              if (count === 0) return null;
              const variant =
                level === "error"
                  ? "destructive"
                  : level === "warning"
                    ? "secondary"
                    : level === "debug" || level === "other"
                      ? "outline"
                      : "default";
              return (
                <Badge
                  key={level}
                  variant={variant}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    selectedLevel === level && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedLevel(level)}
                >
                  {label}: {count}
                </Badge>
              );
            })}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("relative gap-2", isFiltered && "border-primary")}
                >
                  <Filter className={cn("h-4 w-4", isFiltered && "text-primary")} />
                  Filter
                  {isFiltered && (
                    <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      ✓
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Filter by Log Level</h4>
                  <RadioGroup
                    value={selectedLevel}
                    onValueChange={(value: string) => {
                      if (isFilterLevel(value)) {
                        setSelectedLevel(value);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      {logLevelConfig.map(({ level, label, color, count }) => (
                        <div key={level} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={level} id={`filter-${level}`} />
                            <Label
                              htmlFor={`filter-${level}`}
                              className={cn("cursor-pointer text-sm font-normal", color)}
                            >
                              {label}
                            </Label>
                          </div>
                          {count !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {count}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </PopoverContent>
            </Popover>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {(isFiltered || isSearchActive) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2"
                  title="Clear all filters and search"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <Button variant="outline" onClick={handleCopyToClipboard} className="gap-2">
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDownloadLog} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Filter and Search Results Info */}
          {(isSearchActive || isFiltered) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-sm text-muted-foreground">
              {isFiltered && (
                <span className="flex items-center gap-1">
                  Filtered to{" "}
                  <span className="font-medium text-primary">
                    {logLevelConfig.find((c) => c.level === selectedLevel)?.label}
                  </span>
                </span>
              )}
              {isSearchActive && (
                <span>
                  {isFiltered && "•"} Found {filteredContent.length} matching{" "}
                  {filteredContent.length === 1 ? "line" : "lines"}
                </span>
              )}
              {parsedContent.length > 0 && (
                <span>
                  • Showing {filteredContent.length} of {parsedContent.length} total lines
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)] w-full">
            <div className="bg-muted/10">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Loading logs...
                </div>
              ) : filteredContent.length > 0 ? (
                <div>
                  {filteredContent.map(({ line, className, lineNumber, entryIndex }) => {
                    // Check if this is the first line of an entry
                    const lineIndex = filteredContent.findIndex((l) => l.lineNumber === lineNumber);
                    const prevLine = lineIndex > 0 ? filteredContent[lineIndex - 1] : null;
                    const isFirstLineInEntry = !prevLine || prevLine.entryIndex !== entryIndex;

                    const isLongLine = line.length > 200;
                    const isExpanded = expandedLines.has(lineNumber);
                    const shouldTruncate = isLongLine && !isExpanded;
                    const displayLine = shouldTruncate ? `${line.substring(0, 200)}...` : line;
                    const isEmptyLine = !line.trim();

                    return (
                      <div
                        key={lineNumber}
                        className={cn(
                          "group relative flex items-start gap-0 transition-colors",
                          isFirstLineInEntry && "border-t border-border/30",
                          isEmptyLine && "opacity-40"
                        )}
                      >
                        {/* Line number - minimal styling */}
                        <span className="w-16 shrink-0 select-none border-r border-border/30 bg-muted/30 px-3 py-1.5 text-right font-mono text-[10px] text-muted-foreground/50">
                          {lineNumber}
                        </span>

                        {/* Log content - flat, no padding */}
                        <div className="min-w-0 flex-1 py-1.5 pl-3 pr-4">
                          <span
                            className={cn(
                              "whitespace-pre-wrap break-words font-mono text-xs leading-relaxed",
                              className
                            )}
                          >
                            {displayLine || " "}
                          </span>
                        </div>

                        {/* Expand/collapse button for long lines */}
                        {isLongLine && (
                          <div className="shrink-0 py-1.5 pr-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => toggleLineExpansion(lineNumber)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : logInfo.content ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-center">
                    <Search className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No logs match your filters</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedLevel("all");
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No log content available
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

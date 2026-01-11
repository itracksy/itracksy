/**
 * Day Timeline - Layer 2: Tactical Insight
 *
 * Gantt-style horizontal timeline showing activity blocks.
 * Answers: "Where did my time go today?"
 * Reveals fragmentation vs deep work blocks.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DayTimelineProps {
  timeRange: TimeRange;
  boardId?: string;
}

interface TimeBlock {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  type: "focus" | "break";
  title: string;
  app: string;
}

export function DayTimeline({ timeRange, boardId }: DayTimelineProps) {
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
    refetchInterval: 30000,
  });

  // Process hourly data into timeline blocks
  const { blocks, stats } = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return { blocks: [], stats: { focusBlocks: 0, longestBlock: 0, fragmentation: 0 } };
    }

    const timeBlocks: TimeBlock[] = [];
    let focusBlockCount = 0;
    let longestBlock = 0;

    for (const hour of hourlyData) {
      const hourNum = hour.hour;
      const focusMinutes = Math.round(hour.totalSecondsFocusedTime / 60);
      const breakMinutes = Math.round(hour.totalSecondsBreakTime / 60);

      if (focusMinutes > 0) {
        timeBlocks.push({
          startHour: hourNum,
          startMinute: 0,
          durationMinutes: Math.min(focusMinutes, 60),
          type: "focus",
          title: hour.activities?.[0]?.title || "Focus Session",
          app: hour.activities?.[0]?.ownerName || "",
        });
        focusBlockCount++;
        longestBlock = Math.max(longestBlock, focusMinutes);
      }

      if (breakMinutes > 0) {
        timeBlocks.push({
          startHour: hourNum,
          startMinute: focusMinutes,
          durationMinutes: Math.min(breakMinutes, 60 - focusMinutes),
          type: "break",
          title: "Break",
          app: "",
        });
      }
    }

    // Fragmentation = number of switches per hour of work
    const totalFocusHours = hourlyData.reduce(
      (sum, h) => sum + h.totalSecondsFocusedTime / 3600,
      0
    );
    const fragmentation = totalFocusHours > 0 ? Math.round(focusBlockCount / totalFocusHours) : 0;

    return {
      blocks: timeBlocks,
      stats: { focusBlocks: focusBlockCount, longestBlock, fragmentation },
    };
  }, [hourlyData]);

  // Generate hour markers (6 AM to 10 PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const hasData = blocks.length > 0;

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Timeline Stats */}
      {hasData && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{stats.focusBlocks}</span> focus blocks
          </span>
          <span>
            <span className="font-medium text-foreground">{stats.longestBlock}m</span> longest
            session
          </span>
          {stats.fragmentation > 2 && (
            <span className="text-orange-600">
              High fragmentation ({stats.fragmentation} switches/hr)
            </span>
          )}
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative">
        {/* Hour Labels */}
        <div className="mb-1 flex">
          {hours.map((hour) => (
            <div key={hour} className="flex-1 text-center text-[10px] text-muted-foreground">
              {hour % 3 === 0 ? `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "p" : "a"}` : ""}
            </div>
          ))}
        </div>

        {/* Timeline Track */}
        <div className="relative h-10 rounded-md bg-muted/30">
          {/* Hour grid lines */}
          <div className="absolute inset-0 flex">
            {hours.map((hour, i) => (
              <div
                key={hour}
                className={`flex-1 ${i < hours.length - 1 ? "border-r border-border/30" : ""}`}
              />
            ))}
          </div>

          {/* Activity Blocks */}
          {blocks.map((block, i) => {
            // Calculate position (6 AM = 0%, 10 PM = 100%)
            const startPercent = ((block.startHour - 6 + block.startMinute / 60) / 16) * 100;
            const widthPercent = (block.durationMinutes / 60 / 16) * 100;

            if (startPercent < 0 || startPercent > 100) return null;

            return (
              <TooltipProvider key={i} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute top-1 h-8 cursor-pointer rounded transition-all hover:opacity-80 ${
                        block.type === "focus" ? "bg-primary" : "bg-blue-400"
                      }`}
                      style={{
                        left: `${Math.max(0, startPercent)}%`,
                        width: `${Math.max(0.5, Math.min(widthPercent, 100 - startPercent))}%`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{block.title}</p>
                    {block.app && <p className="text-muted-foreground">{block.app}</p>}
                    <p className="text-muted-foreground">
                      {block.startHour}:{block.startMinute.toString().padStart(2, "0")} -{" "}
                      {block.durationMinutes}m ({block.type})
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Empty State */}
          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              No activity recorded yet
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-primary" />
            <span>Focus</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-blue-400" />
            <span>Break</span>
          </div>
        </div>
      </div>
    </div>
  );
}

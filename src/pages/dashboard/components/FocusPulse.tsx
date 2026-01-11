/**
 * Focus Pulse - Layer 1: Immediate Feedback
 *
 * Single Focus Score with circular progress ring.
 * Answers: "How am I doing right now?"
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";
import { TrendingUp, TrendingDown, Minus, Zap, Coffee, Target } from "lucide-react";

interface FocusPulseProps {
  timeRange: TimeRange;
  boardId?: string;
}

type FocusStatus = "deep-work" | "productive" | "distracted" | "recovering" | "no-data";

const STATUS_CONFIG: Record<FocusStatus, { label: string; color: string; bgColor: string }> = {
  "deep-work": { label: "Deep Work", color: "text-green-600", bgColor: "bg-green-500" },
  productive: { label: "Productive", color: "text-blue-600", bgColor: "bg-blue-500" },
  distracted: { label: "Distracted", color: "text-orange-600", bgColor: "bg-orange-500" },
  recovering: { label: "Recovering", color: "text-purple-600", bgColor: "bg-purple-500" },
  "no-data": { label: "Start Working", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export function FocusPulse({ timeRange, boardId }: FocusPulseProps) {
  const { data, isLoading } = useQuery({
    queryKey: [
      "dashboard.getFocusPerformanceByPeriod",
      timeRange.start,
      timeRange.end,
      "daily",
      boardId,
    ],
    queryFn: () =>
      trpcClient.dashboard.getFocusPerformanceByPeriod.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        period: "daily",
        boardId,
      }),
    refetchInterval: 30000,
  });

  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        focusScore: 0,
        totalFocusTime: 0,
        productivity: 0,
        sessions: 0,
        trend: 0,
        status: "no-data" as FocusStatus,
      };
    }

    // Get today's data (last item)
    const today = data[data.length - 1];
    const totalFocusTime = today?.totalFocusTime || 0;
    const productiveTime = today?.productiveTime || 0;
    const productivity = today?.productivityPercentage || 0;
    const sessions = today?.totalSessions || 0;

    // Calculate focus score (0-100)
    // Based on: productivity weight (60%) + time weight (40%)
    const dailyGoalSeconds = 4 * 3600; // 4 hours daily goal
    const timeScore = Math.min(100, (totalFocusTime / dailyGoalSeconds) * 100);
    const focusScore = Math.round(productivity * 0.6 + timeScore * 0.4);

    // Calculate trend vs yesterday
    let trend = 0;
    if (data.length >= 2) {
      const yesterday = data[data.length - 2];
      if (yesterday?.totalFocusTime > 0) {
        trend = Math.round(
          ((totalFocusTime - yesterday.totalFocusTime) / yesterday.totalFocusTime) * 100
        );
      }
    }

    // Determine status
    let status: FocusStatus = "no-data";
    if (totalFocusTime > 0) {
      if (productivity >= 80 && totalFocusTime > 2 * 3600) {
        status = "deep-work";
      } else if (productivity >= 60) {
        status = "productive";
      } else if (productivity >= 40) {
        status = "recovering";
      } else {
        status = "distracted";
      }
    }

    return { focusScore, totalFocusTime, productivity, sessions, trend, status };
  }, [data]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // SVG circle properties
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (metrics.focusScore / 100) * circumference;
  const statusConfig = STATUS_CONFIG[metrics.status];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
      {/* Focus Score Ring */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={statusConfig.color}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{metrics.focusScore}</span>
          <span className="text-xs text-muted-foreground">Focus Score</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusConfig.bgColor}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          {metrics.trend !== 0 && (
            <span
              className={`flex items-center text-xs ${metrics.trend > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {metrics.trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(metrics.trend)}% vs yesterday
            </span>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-lg font-semibold">{formatDuration(metrics.totalFocusTime)}</p>
              <p className="text-xs text-muted-foreground">Focus Time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-lg font-semibold">{metrics.productivity}%</p>
              <p className="text-xs text-muted-foreground">Productive</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-lg font-semibold">{metrics.sessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

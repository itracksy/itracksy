/**
 * Productivity Insights - Layer 3: Strategic Analysis
 *
 * AI-style insights based on user's data patterns.
 * Provides actionable recommendations.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRange } from "@/types/time";
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, Clock, Zap } from "lucide-react";

interface ProductivityInsightsProps {
  timeRange: TimeRange;
  boardId?: string;
}

interface Insight {
  type: "success" | "warning" | "tip";
  icon: typeof Lightbulb;
  title: string;
  description: string;
}

export function ProductivityInsights({ timeRange, boardId }: ProductivityInsightsProps) {
  const { data: performanceData } = useQuery({
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
  });

  const { data: hourlyData } = useQuery({
    queryKey: ["dashboard.getFocusedTimeByHour", timeRange.start, timeRange.end, boardId],
    queryFn: () =>
      trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start,
        endDate: timeRange.end,
        boardId,
      }),
  });

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    if (!performanceData || performanceData.length === 0) {
      return [
        {
          type: "tip",
          icon: Lightbulb,
          title: "Start tracking",
          description: "Begin your first focus session to get personalized insights.",
        },
      ];
    }

    // Analyze performance data
    const totalFocus = performanceData.reduce((sum, d) => sum + d.totalFocusTime, 0);
    const avgDailyFocus = totalFocus / performanceData.length;
    const avgProductivity =
      performanceData.reduce((sum, d) => sum + d.productivityPercentage, 0) /
      performanceData.length;
    const totalSessions = performanceData.reduce((sum, d) => sum + d.totalSessions, 0);
    const avgSessionLength = totalSessions > 0 ? totalFocus / totalSessions : 0;

    // Check for improvements
    if (performanceData.length >= 7) {
      const recent = performanceData.slice(-3);
      const previous = performanceData.slice(-7, -3);
      const recentAvg = recent.reduce((sum, d) => sum + d.totalFocusTime, 0) / recent.length;
      const previousAvg = previous.reduce((sum, d) => sum + d.totalFocusTime, 0) / previous.length;

      if (recentAvg > previousAvg * 1.1) {
        result.push({
          type: "success",
          icon: TrendingUp,
          title: "You're improving!",
          description: "Your focus time has increased compared to last week. Keep it up!",
        });
      }
    }

    // Check session length
    if (avgSessionLength < 25 * 60) {
      result.push({
        type: "warning",
        icon: Clock,
        title: "Short sessions detected",
        description:
          "Your average session is under 25 minutes. Try the Pomodoro technique for longer focus blocks.",
      });
    } else if (avgSessionLength > 90 * 60) {
      result.push({
        type: "tip",
        icon: Lightbulb,
        title: "Remember to take breaks",
        description: "Your sessions are quite long. Taking short breaks can help maintain focus.",
      });
    }

    // Check productivity
    if (avgProductivity >= 80) {
      result.push({
        type: "success",
        icon: CheckCircle,
        title: "High productivity",
        description: `You're averaging ${Math.round(avgProductivity)}% productivity. Excellent focus!`,
      });
    } else if (avgProductivity < 50) {
      result.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Distractions detected",
        description:
          "Your productivity is below 50%. Consider blocking distracting apps during focus time.",
      });
    }

    // Check daily focus goal
    const dailyGoal = 4 * 3600; // 4 hours
    if (avgDailyFocus >= dailyGoal) {
      result.push({
        type: "success",
        icon: Zap,
        title: "Goal crusher",
        description: "You're consistently hitting your daily focus goal. Amazing dedication!",
      });
    } else if (avgDailyFocus < dailyGoal * 0.5) {
      result.push({
        type: "tip",
        icon: Lightbulb,
        title: "Build momentum",
        description: "Try starting with just 25-minute focus sessions to build a consistent habit.",
      });
    }

    // Analyze hourly patterns
    if (hourlyData && hourlyData.length > 0) {
      const lateNightWork = hourlyData
        .filter((h) => h.hour >= 22 || h.hour < 6)
        .reduce((sum, h) => sum + h.totalSecondsFocusedTime, 0);
      const totalWork = hourlyData.reduce((sum, h) => sum + h.totalSecondsFocusedTime, 0);

      if (totalWork > 0 && lateNightWork / totalWork > 0.2) {
        result.push({
          type: "warning",
          icon: AlertTriangle,
          title: "Late night work",
          description:
            "Over 20% of your work is happening late at night. This may affect sleep quality.",
        });
      }
    }

    // Return top 3 insights
    return result.slice(0, 3);
  }, [performanceData, hourlyData]);

  const iconConfig = {
    success: { bg: "bg-green-500/10", text: "text-green-600" },
    warning: { bg: "bg-orange-500/10", text: "text-orange-600" },
    tip: { bg: "bg-blue-500/10", text: "text-blue-600" },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          const config = iconConfig[insight.type];
          return (
            <div key={i} className="flex gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.text}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

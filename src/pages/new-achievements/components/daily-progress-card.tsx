import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, CheckCircle, TrendingUp, Timer, Trophy, Zap } from "lucide-react";
import { formatTime } from "@/lib/utils";

export function DailyProgressCard() {
  // Get today's progress
  const { data: progress, isLoading } = useQuery({
    queryKey: ["todaysProgress"],
    queryFn: () => trpcClient.focusTargets.getTodaysProgress.query(),
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-sm text-muted-foreground">Loading progress...</div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null; // No target set
  }

  const getMotivationalMessage = () => {
    if (progress.isCompleted) {
      return "🎉 Target achieved! Great job staying focused today!";
    }

    if (progress.progressPercentage >= 80) {
      return "🔥 Almost there! You're so close to your goal!";
    }

    if (progress.progressPercentage >= 50) {
      return "💪 Halfway there! Keep up the great work!";
    }

    if (progress.progressPercentage >= 25) {
      return "🚀 Good progress! You're building momentum!";
    }

    if (progress.progressPercentage > 0) {
      return "✨ Nice start! Every minute counts!";
    }

    return "🎯 Ready to start your focus journey today?";
  };

  const getProgressColor = () => {
    if (progress.isCompleted) return "bg-green-500";
    if (progress.progressPercentage >= 75) return "bg-tracksy-gold";
    if (progress.progressPercentage >= 50) return "bg-blue-500";
    return "bg-tracksy-blue";
  };

  return (
    <Card className="w-full border-l-4 border-l-tracksy-blue bg-gradient-to-r from-tracksy-blue/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {progress.isCompleted ? (
              <Trophy className="h-5 w-5 text-yellow-500" />
            ) : (
              <Target className="h-5 w-5 text-tracksy-blue" />
            )}
            <span className="text-tracksy-blue">Today's Progress</span>
          </div>
          {progress.isCompleted && (
            <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              {formatTime(progress.completedMinutes * 60)} /{" "}
              {formatTime(progress.targetMinutes * 60)}
            </span>
            <span className="font-bold text-tracksy-blue">
              {Math.round(progress.progressPercentage)}%
            </span>
          </div>
          <Progress
            value={progress.progressPercentage}
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
            <Clock className="h-4 w-4 text-tracksy-gold" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-semibold text-tracksy-blue">
                {formatTime(progress.completedMinutes * 60)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
            <Timer className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-semibold text-blue-600">
                {progress.isCompleted ? "0m" : formatTime(progress.remainingMinutes * 60)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="font-semibold text-green-600">{progress.sessionsToday}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
            <Zap className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Avg/Session</p>
              <p className="font-semibold text-purple-600">
                {progress.sessionsToday > 0
                  ? formatTime((progress.completedMinutes / progress.sessionsToday) * 60)
                  : "0m"}
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="rounded-lg border border-tracksy-blue/20 bg-tracksy-blue/10 p-3">
          <p className="text-center text-sm font-medium text-tracksy-blue">
            {getMotivationalMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

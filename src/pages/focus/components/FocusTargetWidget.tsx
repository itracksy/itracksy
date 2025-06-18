import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Target, Clock, Settings, Trophy, TrendingUp, Zap, Bell } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function FocusTargetWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [targetMinutes, setTargetMinutes] = useState(120);
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(60);

  // Get current focus target
  const { data: focusTarget } = useQuery({
    queryKey: ["focusTarget"],
    queryFn: () => trpcClient.focusTargets.getFocusTarget.query(),
  });

  // Get today's progress
  const { data: progress } = useQuery({
    queryKey: ["todaysProgress"],
    queryFn: () => trpcClient.focusTargets.getTodaysProgress.query(),
    refetchInterval: 30000, // Refetch every 30 seconds during active sessions
  });

  // Update form when data loads
  useState(() => {
    if (focusTarget) {
      setTargetMinutes(focusTarget.targetMinutes);
      setEnableReminders(focusTarget.enableReminders);
      setReminderIntervalMinutes(focusTarget.reminderIntervalMinutes);
    }
  });

  // Mutation to save focus target
  const updateFocusTarget = useMutation({
    mutationFn: (data: {
      targetMinutes: number;
      enableReminders: boolean;
      reminderIntervalMinutes: number;
    }) => trpcClient.focusTargets.upsertFocusTarget.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focusTarget"] });
      queryClient.invalidateQueries({ queryKey: ["todaysProgress"] });
      toast({
        title: "Target updated!",
        description: "Your focus goal has been saved.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update target.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (targetMinutes < 5 || targetMinutes > 1440) {
      toast({
        title: "Invalid target",
        description: "Target must be between 5 minutes and 24 hours.",
        variant: "destructive",
      });
      return;
    }

    updateFocusTarget.mutate({
      targetMinutes,
      enableReminders,
      reminderIntervalMinutes,
    });
  };

  const getProgressColor = () => {
    if (!progress) return "bg-tracksy-blue";
    if (progress.isCompleted) return "bg-green-500";
    if (progress.progressPercentage >= 75) return "bg-tracksy-gold";
    if (progress.progressPercentage >= 50) return "bg-blue-500";
    return "bg-tracksy-blue";
  };

  const formatTimeShort = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  const getMotivationalMessage = () => {
    if (!progress) return "Set a daily target to track your progress!";

    if (progress.isCompleted) {
      return "🎉 Daily target achieved! Great work!";
    }

    if (progress.progressPercentage >= 75) {
      return "🔥 Almost there! Keep the momentum!";
    }

    if (progress.progressPercentage >= 50) {
      return "💪 Halfway to your goal!";
    }

    if (progress.progressPercentage >= 25) {
      return "🚀 Good progress today!";
    }

    if (progress.progressPercentage > 0) {
      return "✨ Nice start! Keep going!";
    }

    return "🎯 Ready to work toward your goal?";
  };

  if (!focusTarget) {
    return (
      <Card className="w-full border-2 border-dashed border-tracksy-blue/30 bg-tracksy-blue/5">
        <CardContent className="p-4">
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-tracksy-blue" />
              <span className="font-medium text-tracksy-blue">Set Daily Focus Target</span>
            </div>
            <p className="text-xs text-muted-foreground">Track your progress and get motivated!</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-tracksy-blue hover:bg-tracksy-blue/90">
                  <Target className="mr-1 h-3 w-3" />
                  Set Target
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Daily Focus Target</DialogTitle>
                  <DialogDescription>
                    Configure your daily focus goal and reminders.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Daily Target (minutes)</Label>
                    <Input
                      id="target"
                      type="number"
                      min="5"
                      max="1440"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Number(e.target.value))}
                      placeholder="120"
                    />
                    <p className="text-xs text-muted-foreground">
                      Target: {formatTimeShort(targetMinutes)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Enable Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Get motivational notifications
                      </p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={enableReminders}
                      onCheckedChange={setEnableReminders}
                    />
                  </div>

                  {enableReminders && (
                    <div className="space-y-2">
                      <Label htmlFor="interval">Reminder Interval (minutes)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="15"
                        max="480"
                        value={reminderIntervalMinutes}
                        onChange={(e) => setReminderIntervalMinutes(Number(e.target.value))}
                        placeholder="60"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={updateFocusTarget.isPending}
                  >
                    {updateFocusTarget.isPending ? "Saving..." : "Set Target"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-l-4 border-l-tracksy-blue bg-gradient-to-r from-tracksy-blue/5 to-transparent">
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress?.isCompleted ? (
              <Trophy className="h-4 w-4 text-yellow-500" />
            ) : (
              <Target className="h-4 w-4 text-tracksy-blue" />
            )}
            <span className="text-sm font-medium text-tracksy-blue">
              Daily Target: {formatTimeShort(focusTarget.targetMinutes)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {focusTarget.enableReminders && <Bell className="h-3 w-3 text-muted-foreground" />}
            {progress?.isCompleted && (
              <Badge
                variant="secondary"
                className="border-green-200 bg-green-100 text-xs text-green-800"
              >
                Done
              </Badge>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adjust Daily Target</DialogTitle>
                  <DialogDescription>
                    Update your focus goal and reminder settings.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Daily Target (minutes)</Label>
                    <Input
                      id="target"
                      type="number"
                      min="5"
                      max="1440"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Target: {formatTimeShort(targetMinutes)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Enable Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Get motivational notifications
                      </p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={enableReminders}
                      onCheckedChange={setEnableReminders}
                    />
                  </div>

                  {enableReminders && (
                    <div className="space-y-2">
                      <Label htmlFor="interval">Reminder Interval (minutes)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="15"
                        max="480"
                        value={reminderIntervalMinutes}
                        onChange={(e) => setReminderIntervalMinutes(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={updateFocusTarget.isPending}
                  >
                    {updateFocusTarget.isPending ? "Saving..." : "Update Target"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Progress Section */}
        {progress && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {formatTimeShort(progress.completedMinutes)} /{" "}
                  {formatTimeShort(progress.targetMinutes)}
                </span>
                <span className="font-semibold text-tracksy-blue">
                  {Math.round(progress.progressPercentage || 0)}%
                </span>
              </div>
              <Progress
                value={Math.max(0, Math.min(100, Number(progress.progressPercentage) || 0))}
                className="h-3"
                indicatorClassName={getProgressColor()}
              />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-tracksy-gold" />
                <span className="text-muted-foreground">Left:</span>
                <span className="font-medium text-blue-600">
                  {progress.isCompleted ? "0m" : formatTimeShort(progress.remainingMinutes)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-medium text-green-600">{progress.sessionsToday}</span>
              </div>

              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-purple-500" />
                <span className="text-muted-foreground">Avg:</span>
                <span className="font-medium text-purple-600">
                  {progress.sessionsToday > 0
                    ? formatTimeShort(
                        Math.round(progress.completedMinutes / progress.sessionsToday)
                      )
                    : "0m"}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

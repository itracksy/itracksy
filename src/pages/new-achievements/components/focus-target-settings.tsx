import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Target, Clock, Bell, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FocusTargetSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [targetMinutes, setTargetMinutes] = useState(120); // Default 2 hours
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(60);

  // Get current focus target
  const { data: focusTarget, isLoading } = useQuery({
    queryKey: ["focusTarget"],
    queryFn: () => trpcClient.focusTargets.getFocusTarget.query(),
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
        title: "Focus target updated!",
        description: "Your daily focus goal has been saved.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update focus target. Please try again.",
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

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-sm text-muted-foreground">Loading target...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-dashed border-tracksy-blue/30 bg-tracksy-blue/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-tracksy-blue">
          <Target className="h-5 w-5" />
          Daily Focus Target
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {focusTarget ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-tracksy-gold" />
                <span className="text-sm font-medium">Target:</span>
                <span className="text-lg font-bold text-tracksy-blue">
                  {formatTime(focusTarget.targetMinutes)}
                </span>
              </div>
              {focusTarget.enableReminders && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell className="h-3 w-3" />
                  Every {formatTime(focusTarget.reminderIntervalMinutes)}
                </div>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Adjust Target
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Daily Focus Target</DialogTitle>
                  <DialogDescription>
                    Configure your daily focus goal and reminder preferences.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Daily Focus Target (minutes)</Label>
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
                      Current: {formatTime(targetMinutes)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Enable Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Get motivational notifications throughout the day
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
                      <p className="text-xs text-muted-foreground">
                        Remind every {formatTime(reminderIntervalMinutes)}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={updateFocusTarget.isPending}
                  >
                    {updateFocusTarget.isPending ? "Saving..." : "Save Target"}
                  </Button>

                  {/* Test reminder button for development */}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await trpcClient.focusTargets.triggerReminderCheck.mutate();
                        toast({
                          title: "Reminder check triggered",
                          description: "Check your notifications for a reminder message.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to trigger reminder check.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full text-xs"
                  >
                    🔔 Test Reminder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Set a daily focus target to track your progress and stay motivated!
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-tracksy-blue hover:bg-tracksy-blue/90">
                  <Target className="mr-2 h-4 w-4" />
                  Set Daily Target
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Daily Focus Target</DialogTitle>
                  <DialogDescription>
                    Configure your daily focus goal and reminder preferences.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Daily Focus Target (minutes)</Label>
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
                      Target: {formatTime(targetMinutes)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Enable Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Get motivational notifications throughout the day
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
                      <p className="text-xs text-muted-foreground">
                        Remind every {formatTime(reminderIntervalMinutes)}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={updateFocusTarget.isPending}
                  >
                    {updateFocusTarget.isPending ? "Saving..." : "Set Target"}
                  </Button>

                  {/* Test reminder button for development */}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await trpcClient.focusTargets.triggerReminderCheck.mutate();
                        toast({
                          title: "Reminder check triggered",
                          description: "Check your notifications for a reminder message.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to trigger reminder check.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full text-xs"
                  >
                    🔔 Test Reminder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

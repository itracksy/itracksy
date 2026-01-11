import { getTitleTimeEntry } from "@/api/db/timeEntryExt";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { TimeEntryWithRelations } from "@/types/projects";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Tag, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { BoardSelector } from "@/components/tracking/BoardSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAtom } from "jotai";
import {
  selectedBoardIdAtom,
  selectedItemIdAtom,
  playStartSoundAtom,
  playIntervalSoundAtom,
  playCompletionSoundAtom,
  playBreakStartSoundAtom,
  playBreakCompletionSoundAtom,
} from "@/context/board";
import { trpcClient } from "@/utils/trpc";
import { usePomodoroSounds } from "@/hooks/usePomodoroSounds";

const warningMessages = [
  "⏰ Tick tock! Time's flying!",
  "🏃 Run, time is escaping!",
  "🚨 Whoops! Time overflow!",
  "🎯 Target time missed!",
  "⚡ Time to wrap up!",
  "🌪️ Time tornado alert!",
  "🔥 Hot deadline alert!",
  "🎮 Game over... or extend?",
  "🌈 Time to finish up!",
  "🚀 Houston, we've exceeded time!",
];

interface ActiveSessionProps {
  activeTimeEntry: TimeEntryWithRelations;
}

export function ActiveSession({ activeTimeEntry }: ActiveSessionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [duration, setDuration] = useState("00:00");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimeExceeded, setIsTimeExceeded] = useState(false);
  const [warningMessage, setWarningMessage] = useState(warningMessages[0]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingResumeEntry, setPendingResumeEntry] = useState<TimeEntryWithRelations | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
  const [playStartSound] = useAtom(playStartSoundAtom);
  const [playIntervalSound] = useAtom(playIntervalSoundAtom);
  const [playCompletionSound] = useAtom(playCompletionSoundAtom);
  const [playBreakStartSound] = useAtom(playBreakStartSoundAtom);
  const [playBreakCompletionSound] = useAtom(playBreakCompletionSoundAtom);

  const updateTimeEntryMutation = useUpdateTimeEntryMutation();

  // Check for resume requirements when component mounts
  useEffect(() => {
    const checkResumeRequired = async () => {
      try {
        const result = await trpcClient.systemState.checkResumeRequired.query();
        if (result.requiresResume && result.activeEntry) {
          setPendingResumeEntry(result.activeEntry);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error("Failed to check resume requirements:", error);
      }
    };

    checkResumeRequired();

    // Set up polling to check for resume requirements every 2 seconds
    const interval = setInterval(checkResumeRequired, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleExtendTime = async () => {
    if (!activeTimeEntry) return;

    try {
      const newTargetDuration = (activeTimeEntry.targetDuration ?? 0) + 5;
      await updateTimeEntryMutation.mutateAsync({
        id: activeTimeEntry.id,
        targetDuration: newTargetDuration,
      });

      toast({
        title: "Time Extended",
        description: "Added 5 minutes to your session.",
      });
    } catch (error) {
      toast({
        title: "Failed to extend time",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntryMutation.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });

      const mode = activeTimeEntry.isFocusMode ? "Focus" : "Break";
      toast({
        title: `${mode} session completed`,
        description: "Great work! Your time has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Failed to stop session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAssignTask = async () => {
    if (!selectedItemId) {
      toast({
        title: "No task selected",
        description: "Please select a task to assign to this session.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTimeEntryMutation.mutateAsync({
        id: activeTimeEntry.id,
        boardId: selectedBoardId,
        itemId: selectedItemId,
      });

      toast({
        title: "Task Assigned",
        description: "Task has been successfully assigned to this session.",
      });
      setIsAssignModalOpen(false);
    } catch (error) {
      toast({
        title: "Failed to assign task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeConfirm = async () => {
    try {
      await trpcClient.timeEntry.handleSessionResume.mutate({ action: "continue" });
      setShowResumeDialog(false);
      setPendingResumeEntry(null);
      toast({
        title: "Session resumed",
        description: "Your session is now active again.",
      });
      // Refresh the query data
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    } catch (error) {
      toast({
        title: "Failed to resume session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeDismiss = async () => {
    try {
      await trpcClient.timeEntry.handleSessionResume.mutate({ action: "dismiss" });
      setShowResumeDialog(false);
      setPendingResumeEntry(null);
      toast({
        title: "Session dismissed",
        description: "Your session has been ended.",
      });
      // Refresh the query data
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    } catch (error) {
      toast({
        title: "Failed to dismiss session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handlePauseSession = async () => {
    try {
      const result = await trpcClient.timeEntry.manualPause.mutate();
      if (result.success) {
        setIsPaused(true);
        setPausedAt(result.pausedAt);
        toast({
          title: "Session Paused",
          description: "Your session has been paused. Click Resume to continue.",
        });
      } else {
        toast({
          title: "Failed to pause session",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to pause session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeFromPause = async () => {
    try {
      const result = await trpcClient.timeEntry.manualResume.mutate();
      if (result.success) {
        setIsPaused(false);
        setPausedAt(null);
        const pausedSeconds = Math.floor(result.adjustedBy / 1000);
        toast({
          title: "Session Resumed",
          description: `Session resumed. ${pausedSeconds} seconds of pause time excluded.`,
        });
        queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      } else {
        toast({
          title: "Failed to resume session",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to resume session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Poll for pause state
  useEffect(() => {
    const checkPauseState = async () => {
      try {
        const result = await trpcClient.timeEntry.getPauseState.query();
        if (result.isPaused && result.timeEntryId === activeTimeEntry?.id) {
          setIsPaused(true);
          setPausedAt(result.pausedAt);
        } else if (!result.isPaused && isPaused) {
          setIsPaused(false);
          setPausedAt(null);
        }
      } catch (error) {
        console.error("Failed to check pause state:", error);
      }
    };

    checkPauseState();
    const interval = setInterval(checkPauseState, 2000);
    return () => clearInterval(interval);
  }, [activeTimeEntry?.id, isPaused]);

  usePomodoroSounds({
    isFocusMode: Boolean(activeTimeEntry?.isFocusMode),
    targetMinutes: activeTimeEntry?.targetDuration ?? 0,
    remainingSeconds: activeTimeEntry ? remainingSeconds : null,
    sessionId: activeTimeEntry?.id ?? "idle",
    playStartSound,
    playIntervalSound,
    playCompletionSound,
    playBreakStartSound,
    playBreakCompletionSound,
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry) {
      const updateTimer = () => {
        // Use pausedAt time if paused, otherwise use current time
        const now = isPaused && pausedAt ? new Date(pausedAt) : new Date();
        const startTimeDate = new Date(activeTimeEntry.startTime);
        const minutes = activeTimeEntry.targetDuration ?? 0;

        // Handle unlimited sessions (targetDuration = 0)
        if (minutes === 0) {
          const elapsedSeconds = Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
          const elapsedHours = Math.floor(elapsedSeconds / 3600);
          const elapsedMins = Math.floor((elapsedSeconds % 3600) / 60);
          const elapsedSecs = elapsedSeconds % 60;

          if (elapsedHours > 0) {
            setDuration(
              `${elapsedHours}:${elapsedMins.toString().padStart(2, "0")}:${elapsedSecs.toString().padStart(2, "0")}`
            );
          } else {
            setDuration(
              `${elapsedMins.toString().padStart(2, "0")}:${elapsedSecs.toString().padStart(2, "0")}`
            );
          }
          setIsTimeExceeded(false);
          setRemainingSeconds(null);
          return;
        }

        const secondsDiff =
          minutes * 60 - Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
        setRemainingSeconds(secondsDiff);

        // Format time differently for negative values
        if (secondsDiff <= 0) {
          const absDiff = Math.abs(secondsDiff);
          const hours = Math.floor(absDiff / 3600);
          const mins = Math.floor((absDiff % 3600) / 60);
          const secs = absDiff % 60;

          // Only stop if autoStopEnabled is true and not paused
          if (secondsDiff < 0 && activeTimeEntry.autoStopEnabled && !isPaused) {
            queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
            setDuration("00:00");
            setIsTimeExceeded(false);
            setRemainingSeconds(0);
            return;
          } else {
            if (hours > 0) {
              setDuration(
                `-${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
              );
            } else {
              setDuration(
                `-${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
              );
            }
            setIsTimeExceeded(true);
            // Change message every 60 seconds when time is exceeded
            const messageIndex = Math.floor(Math.abs(secondsDiff) / 60) % warningMessages.length;
            setWarningMessage(warningMessages[messageIndex]);
          }
        } else {
          const hours = Math.floor(secondsDiff / 3600);
          const mins = Math.floor((secondsDiff % 3600) / 60);
          const secs = secondsDiff % 60;

          if (hours > 0) {
            setDuration(
              `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
            );
          } else {
            setDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
          }
          setIsTimeExceeded(false);
        }
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry, isPaused, pausedAt]);

  useEffect(() => {
    if (!activeTimeEntry) {
      setRemainingSeconds(null);
    }
  }, [activeTimeEntry]);

  // Listen for resume pending event from main process
  useEffect(() => {
    const electronClock = (window as any).electronClock;
    if (electronClock) {
      const handleResumePending = (entry: any) => {
        setPendingResumeEntry(entry);
        setShowResumeDialog(true);
      };
      electronClock.onResumePending(handleResumePending);
      return () => electronClock.removeResumePendingListener();
    }
  }, []);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!activeTimeEntry) return 0;
    const targetMinutes = activeTimeEntry.targetDuration ?? 0;
    if (targetMinutes === 0) return 100; // Unlimited session shows full ring

    const totalSeconds = targetMinutes * 60;
    const elapsed = totalSeconds - (remainingSeconds ?? totalSeconds);
    return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
  };

  const progressPercentage = getProgressPercentage();
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <>
      {/* Active Session Display */}
      <div className="text-center">
        <h2 className="mb-6 text-xl font-medium text-[#2B4474] dark:text-white">Current Session</h2>
        <div className="mb-10 inline-block rounded-full border border-[#E5A853]/30 bg-[#E5A853]/10 px-5 py-2.5">
          <div className="flex items-center justify-center gap-2 text-[#2B4474] dark:text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#E5A853]"></span>
            <span className="font-medium">{getTitleTimeEntry(activeTimeEntry)}</span>
            {(activeTimeEntry.targetDuration ?? 0) === 0 && (
              <span className="ml-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                ∞
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display with Progress Ring - only for timed sessions */}
      {(activeTimeEntry.targetDuration ?? 0) > 0 ? (
        <div className="relative mx-auto h-64 w-64">
          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-[#E5A853]/20"
            />
            {/* Progress circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className={isTimeExceeded ? "text-red-500" : "text-[#E5A853]"}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: isTimeExceeded ? 0 : strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>

          {/* Timer content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-5xl font-bold text-[#2B4474] dark:text-white">
              {duration}
            </span>
            {isPaused && (
              <div className="flex flex-col items-center space-y-1">
                <Pause className="h-5 w-5 text-[#E5A853]" />
                <span className="text-sm font-medium text-[#E5A853]">PAUSED</span>
              </div>
            )}
            {isTimeExceeded && !isPaused && (
              <div className="flex flex-col items-center space-y-1">
                <AlertTriangle className="h-5 w-5 animate-bounce text-red-500" />
                <span
                  className="max-w-[180px] text-center text-xs font-medium text-red-500 transition-all duration-300"
                  style={{
                    animation: "warning 2s infinite",
                  }}
                >
                  {warningMessage}
                </span>
              </div>
            )}
            {!isPaused && !isTimeExceeded && (
              <span className="text-xs text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Unlimited mode - simple tracking indicator */
        <div className="relative mx-auto flex h-64 w-64 flex-col items-center justify-center">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full border-[12px] border-[#E5A853]/30" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-40 w-40 rounded-full border-[8px] border-[#E5A853]/50"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            {isPaused ? (
              <>
                <Pause className="h-12 w-12 text-[#E5A853]" />
                <span className="text-lg font-medium text-[#E5A853]">PAUSED</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#E5A853]" />
                  <span className="text-lg font-medium text-[#2B4474] dark:text-white">
                    Tracking
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Your activities are being recorded
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 pt-6">
        {/* Extend Time Button - only show for timed sessions */}
        {(activeTimeEntry.targetDuration ?? 0) > 0 && (
          <Button
            onClick={handleExtendTime}
            variant="outline"
            className="min-w-[100px]"
            disabled={isPaused}
          >
            +5 MIN
          </Button>
        )}
        {/* Pause/Resume Button */}
        <Button
          onClick={isPaused ? handleResumeFromPause : handlePauseSession}
          variant={isPaused ? "default" : "outline"}
          className="min-w-[100px]"
        >
          {isPaused ? (
            <>
              <Play className="mr-1 h-4 w-4" />
              RESUME
            </>
          ) : (
            <>
              <Pause className="mr-1 h-4 w-4" />
              PAUSE
            </>
          )}
        </Button>
        <Button onClick={handleStopTimeEntry} variant="default" className="min-w-[100px]">
          STOP
        </Button>
      </div>

      {/* Task Assignment Section */}
      {activeTimeEntry.isFocusMode && (
        <Card className="mt-6 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                {activeTimeEntry.itemId ? "Current Task" : "Task Assignment"}
              </CardTitle>
              {activeTimeEntry.itemId ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Assigned to: {activeTimeEntry.item?.title || "Unknown Task"}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                    Change Task
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(true)}>
                  Assign Task
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Task Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Task to Session</DialogTitle>
            <DialogDescription>
              Select a task to assign to your current focus session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Session Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🌙 Welcome back! Resume your session?</DialogTitle>
            <DialogDescription>
              You have a paused {pendingResumeEntry?.isFocusMode ? "focus" : "break"} session that
              was temporarily paused while you were away.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {pendingResumeEntry && (
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Session Details:
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    Mode:{" "}
                    <span className="font-medium">
                      {pendingResumeEntry.isFocusMode ? "🎯 Focus" : "🚀 Break"}
                    </span>
                  </div>
                  <div>
                    Description:{" "}
                    <span className="font-medium">{pendingResumeEntry.description}</span>
                  </div>
                  {pendingResumeEntry.targetDuration && pendingResumeEntry.targetDuration > 0 && (
                    <div>
                      Target:{" "}
                      <span className="font-medium">
                        {pendingResumeEntry.targetDuration} minutes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Choose "Continue" to resume your session, or "Dismiss" to end it.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResumeDismiss}>
              Dismiss Session
            </Button>
            <Button variant="default" onClick={handleResumeConfirm}>
              Continue Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes warning {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

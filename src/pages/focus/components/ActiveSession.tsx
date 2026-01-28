import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { TimeEntryWithRelations } from "@/types/projects";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Tag,
  Pause,
  Play,
  Calendar,
  Infinity as InfinityIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BoardSelector } from "@/components/tracking/BoardSelector";
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

  // Check for resume requirements once on mount (in case app opens with paused session)
  useEffect(() => {
    const checkInitialState = async () => {
      try {
        const result = await trpcClient.systemState.checkResumeRequired.query();
        if (result.requiresResume && result.activeEntry) {
          setIsPaused(true);
          setPausedAt(result.pausedAt);
          setPendingResumeEntry(result.activeEntry);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error("Failed to check initial resume state:", error);
      }
    };

    checkInitialState();
  }, []);

  // Listen for pause state updates and resume requirements via IPC
  useEffect(() => {
    const electronSessionPause = (window as any).electronSessionPause;
    if (electronSessionPause) {
      electronSessionPause.onPauseStateChange(
        (state: {
          isPaused: boolean;
          pausedAt: number | null;
          timeEntryId: string | null;
          requiresResume?: boolean;
          activeEntry?: any;
        }) => {
          // Only update if the pause state is for this session
          if (state.timeEntryId === activeTimeEntry?.id || !state.isPaused) {
            setIsPaused(state.isPaused);
            setPausedAt(state.pausedAt);

            // Show resume dialog if required
            if (state.requiresResume && state.activeEntry) {
              setPendingResumeEntry(state.activeEntry);
              setShowResumeDialog(true);
            }
          }
        }
      );
      return () => electronSessionPause.removePauseStateListener();
    }
  }, [activeTimeEntry?.id]);

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
      // Refresh the query data and wait for it to complete before updating UI
      // This ensures the timer gets the adjusted startTime before resuming
      await queryClient.refetchQueries({ queryKey: ["timeEntries", "active"] });
      setShowResumeDialog(false);
      setPendingResumeEntry(null);
      setIsPaused(false);
      setPausedAt(null);
      toast({
        title: "Session resumed",
        description: "Your session is now active again.",
      });
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
      // Refresh the query data and wait for it to complete
      await queryClient.refetchQueries({ queryKey: ["timeEntries", "active"] });
      setShowResumeDialog(false);
      setPendingResumeEntry(null);
      setIsPaused(false);
      setPausedAt(null);
      toast({
        title: "Session dismissed",
        description: "Your session has been ended.",
      });
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
                `+${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
              );
            } else {
              setDuration(
                `+${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
  }, [activeTimeEntry, isPaused, pausedAt, queryClient]);

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

  // Determine session source type
  const isScheduledSession = activeTimeEntry.description?.startsWith("Scheduled:");
  const isUnlimitedSession = (activeTimeEntry.targetDuration ?? 0) === 0;
  const targetMinutes = activeTimeEntry.targetDuration ?? 0;

  const getSessionTypeInfo = () => {
    if (isScheduledSession) {
      return {
        icon: Calendar,
        label: "Scheduled",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500/30",
      };
    }
    if (isUnlimitedSession) {
      return {
        icon: InfinityIcon,
        label: "Unlimited",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
      };
    }
    return {
      icon: Clock,
      label: `${targetMinutes} min`,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    };
  };

  const sessionTypeInfo = getSessionTypeInfo();
  const SessionTypeIcon = sessionTypeInfo.icon;

  return (
    <>
      {/* Active Session Display */}
      <div className="text-center">
        <h2 className="mb-4 text-xl font-medium text-[#2B4474] dark:text-white">Current Session</h2>

        {/* Session Type Badge */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center rounded-full border border-[#E5A853]/30 bg-[#E5A853]/10 px-4 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#E5A853]"></span>
            <span className="ml-2 font-medium text-[#2B4474] dark:text-white">
              {activeTimeEntry.isFocusMode ? "Focus Session" : "Break Session"}
            </span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${sessionTypeInfo.bgColor} ${sessionTypeInfo.borderColor}`}
          >
            <SessionTypeIcon className={`h-3.5 w-3.5 ${sessionTypeInfo.color}`} />
            <span className={`text-xs font-medium ${sessionTypeInfo.color}`}>
              {sessionTypeInfo.label}
            </span>
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
        <div className="mt-8">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="group w-full rounded-xl border border-slate-200 bg-white/50 p-4 text-left transition-all hover:border-[#E5A853]/50 hover:bg-[#E5A853]/5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#E5A853]/50 dark:hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    activeTimeEntry.itemId
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  {activeTimeEntry.itemId ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Tag className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {activeTimeEntry.itemId ? "Current Task" : "Task Assignment"}
                  </div>
                  <div
                    className={`mt-0.5 font-medium ${
                      activeTimeEntry.itemId
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {activeTimeEntry.itemId
                      ? activeTimeEntry.item?.title || "Unknown Task"
                      : "Click to assign a task"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 group-hover:text-[#E5A853] dark:text-slate-400">
                  {activeTimeEntry.itemId ? "Change" : "Assign"}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#E5A853]" />
              </div>
            </div>
          </button>
        </div>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Play className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Welcome back!</DialogTitle>
            <DialogDescription className="text-center">
              Your {pendingResumeEntry?.isFocusMode ? "focus" : "break"} session was paused while
              you were away. Would you like to continue?
            </DialogDescription>
          </DialogHeader>

          {pendingResumeEntry && (
            <div className="my-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        pendingResumeEntry.isFocusMode
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      <span className="text-lg">
                        {pendingResumeEntry.isFocusMode ? "🎯" : "☕"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {pendingResumeEntry.isFocusMode ? "Focus Session" : "Break Session"}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {pendingResumeEntry.description || "No description"}
                      </div>
                    </div>
                  </div>
                  {pendingResumeEntry.targetDuration && pendingResumeEntry.targetDuration > 0 && (
                    <div className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {pendingResumeEntry.targetDuration} min
                    </div>
                  )}
                </div>
              </div>

              {pausedAt && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Pause className="h-4 w-4" />
                  <span>
                    Paused at{" "}
                    {new Date(pausedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="default"
              onClick={handleResumeConfirm}
              className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Continue Session
            </Button>
            <Button
              variant="ghost"
              onClick={handleResumeDismiss}
              className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              End Session
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

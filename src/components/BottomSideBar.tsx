import { useState } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
  useLastTimeEntry,
} from "@/hooks/useTimeEntryQueries";
import { Play, Square, Coffee, MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { trpcClient } from "@/utils/trpc";
import { useAtom } from "jotai";
import { breakDurationAtom } from "@/context/board";

import { useNavigate } from "@tanstack/react-router";
import { getTitleTimeEntry } from "@/api/db/timeEntryExt";
import { useSidebar } from "@/components/ui/sidebar";

export function BottomSideBar() {
  const [breakDuration, setBreakDuration] = useAtom(breakDurationAtom);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { data: activeTimeEntry } = useActiveTimeEntry();
  const { data: lastTimeEntry } = useLastTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });

      toast({
        title: "Session ended",
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

  const handleTakeBreak = async () => {
    if (!activeTimeEntry || !breakDuration) {
      toast({
        title: "Error",
        description: "Please stop the current session before taking a break",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });

      createTimeEntry.mutate({
        startTime: Date.now(),
        isFocusMode: false,
        targetDuration: breakDuration,
        description: `Break for ${breakDuration} minutes`,
      });

      toast({
        title: `Break started`,
        description: `Enjoy your ${breakDuration} minute break!`,
      });
    } catch (error) {
      toast({
        title: "Failed to start break",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeLastTask = () => {
    if (!lastTimeEntry) {
      toast({
        title: "No previous task found",
        description: "Start a new session to track your work!",
      });
      return;
    }

    createTimeEntry.mutate(
      {
        boardId: lastTimeEntry.boardId,
        itemId: lastTimeEntry.itemId,
        startTime: Date.now(),
        isFocusMode: lastTimeEntry.isFocusMode,
        targetDuration: lastTimeEntry.targetDuration,
        description: lastTimeEntry.description,
        autoStopEnabled: lastTimeEntry.autoStopEnabled,
      },
      {
        onSuccess: () => {
          toast({
            title: "Resumed task",
            description: `Now tracking: ${getTitleTimeEntry(lastTimeEntry)}`,
          });
          navigate({ to: "/" });
        },
        onError: (error) => {
          toast({
            title: "Failed to resume task",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const openFeedbackLink = () => {
    trpcClient.utils.openExternalUrl.mutate({
      url: "https://itracksy.com/feedback",
    });
  };

  // Collapsed state - show only icons
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        {activeTimeEntry ? (
          <>
            <button
              onClick={handleStopTimeEntry}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
              title="Stop Session"
            >
              <Square className="h-5 w-5" />
            </button>
            {activeTimeEntry.isFocusMode && (
              <button
                onClick={handleTakeBreak}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400"
                title="Take Break"
              >
                <Coffee className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-600 transition-colors hover:bg-green-500/30 dark:text-green-400"
            title="Start Session"
          >
            <Play className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={openFeedbackLink}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Send Feedback"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Expanded state - show full content
  return (
    <div className="space-y-2">
      {activeTimeEntry ? (
        <>
          {/* Active Session Card */}
          <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 dark:from-amber-500/20 dark:to-orange-500/20">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                {activeTimeEntry.isFocusMode ? "Focus Session" : "Break Time"}
              </span>
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            </div>
            <p className="mb-3 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {getTitleTimeEntry(activeTimeEntry)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleStopTimeEntry}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
              >
                <Square className="h-3 w-3" />
                Stop
              </button>
              {activeTimeEntry.isFocusMode && (
                <button
                  onClick={handleTakeBreak}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400"
                >
                  <Coffee className="h-3 w-3" />
                  Break
                </button>
              )}
            </div>
          </div>

          {/* Break Duration Input - only show during focus mode */}
          {activeTimeEntry.isFocusMode && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Break:</span>
              <input
                type="number"
                min="1"
                max="120"
                value={breakDuration ?? ""}
                onChange={(e) => {
                  const value = Math.min(120, Math.max(1, parseInt(e.target.value) || 0));
                  setBreakDuration(value > 0 ? value : 5);
                }}
                className="h-6 w-12 rounded border border-slate-200 bg-transparent px-1 text-center text-xs text-slate-600 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:text-slate-300"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Start Session Button */}
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 text-left transition-all hover:from-green-500/20 hover:to-emerald-500/20 dark:from-green-500/20 dark:to-emerald-500/20"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Start Session
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ready to focus?</p>
            </div>
          </button>

          {/* Resume Last Task */}
          {lastTimeEntry && (
            <button
              onClick={handleResumeLastTask}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                  Resume: {getTitleTimeEntry(lastTimeEntry)}
                </p>
              </div>
            </button>
          )}
        </>
      )}

      {/* Feedback Button */}
      <button
        onClick={openFeedbackLink}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        <span>Send Feedback</span>
      </button>
    </div>
  );
}

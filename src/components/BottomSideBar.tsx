import { useState } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
  useLastTimeEntry,
} from "@/hooks/useTimeEntryQueries";
import { PlayCircle, StopCircle, History, Coffee, MessageSquare } from "lucide-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

import { trpcClient } from "@/utils/trpc";
import { useAtom } from "jotai";
import { breakDurationAtom } from "@/context/board";

import { useNavigate } from "@tanstack/react-router";
import { get } from "http";
import { getTitleTimeEntry } from "@/api/db/timeEntryExt";
import { trpc } from "trpc";

// Motivational phrases to encourage users to start working
const motivationalPhrases = [
  "Let's get rolling!",
  "Time to crush it!",
  "Ready to be productive?",
  "Start something amazing!",
  "Make today count!",
  "Time to shine!",
  "Focus mode: activate!",
  "Let's make progress!",
  "Achievement unlocked: Start!",
  "Your future self thanks you!",
];

// Function to get a random motivational phrase
const getRandomMotivationalPhrase = () => {
  const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
  return motivationalPhrases[randomIndex];
};

export function BottomSideBar() {
  const [breakDuration, setBreakDuration] = useAtom(breakDurationAtom);
  const [motivationalPhrase] = useState(getRandomMotivationalPhrase());

  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const { data: lastTimeEntry } = useLastTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) {
      return;
    }

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });

      toast({
        title: "Time entry stopped",
        description: "Great work! Your time has been recorded. ",
      });
    } catch (error) {
      toast({
        title: "Failed to stop time entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTakeBreak = async () => {
    if (!activeTimeEntry || !breakDuration) {
      toast({
        title: "Error",
        description: "Please stop the current time entry before taking a break",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });
      // create a break
      createTimeEntry.mutate({
        startTime: Date.now(),
        isFocusMode: false,
        targetDuration: breakDuration,
        description: `Break for ${breakDuration} minutes`,
      });
      // Show toast notification
      toast({
        title: `${breakDuration} minute break started! 🎉`,
        description: "You've earned it! Time entry has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Failed to stop time entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeLastTask = () => {
    if (!lastTimeEntry) {
      toast({
        title: "No previous task found",
        description: "Start a new time entry to track your work!",
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
    // Open the feedback URL in a new browser window
    trpcClient.utils.openExternalUrl.mutate({
      url: "https://itracksy.com/feedback",
    });
  };

  return (
    <>
      <>
        {activeTimeEntry ? (
          <>
            <SidebarMenuButton
              onClick={handleStopTimeEntry}
              className="hover:text-red-600"
              tooltip="Stop tracking"
            >
              <StopCircle className="h-6 w-6 text-red-600" />
              <span className="flex items-center gap-2 text-base font-medium">
                <span>{getTitleTimeEntry(activeTimeEntry)}</span>
              </span>
            </SidebarMenuButton>

            {activeTimeEntry.isFocusMode && (
              <SidebarMenuButton
                className="flex flex-row items-center gap-2 hover:text-orange-600"
                tooltip="Take a well-deserved break!"
              >
                <Coffee className="h-6 w-6 text-orange-600" />
                <div onClick={handleTakeBreak} className="hover:text-orange-600 hover:underline">
                  <span className="text-base text-muted-foreground">Take a break</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={breakDuration ?? ""}
                  onChange={(e) => {
                    const value = Math.min(120, Math.max(1, parseInt(e.target.value) || 0));
                    if (value > 0) {
                      setBreakDuration(value);
                    } else {
                      setBreakDuration(5);
                    }
                    e.preventDefault();
                  }}
                  className="h-8 w-[50px] rounded-md border border-input/20 bg-transparent text-sm hover:bg-accent/50 hover:text-accent-foreground focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
                />
              </SidebarMenuButton>
            )}
          </>
        ) : (
          <>
            <SidebarMenuButton
              onClick={() => navigate({ to: "/" })}
              className="hover:text-green-600"
              tooltip="Start tracking your work"
            >
              <PlayCircle className="h-6 w-6 text-green-600" />
              <span className="text-base text-muted-foreground">{motivationalPhrase}</span>
            </SidebarMenuButton>

            {lastTimeEntry && (
              <SidebarMenuButton
                onClick={handleResumeLastTask}
                className="hover:text-blue-600"
                tooltip={`Resume: ${getTitleTimeEntry(lastTimeEntry)}`}
              >
                <History className="h-5 w-5 text-blue-600" />
                <span className="text-base text-muted-foreground">
                  Resume: {getTitleTimeEntry(lastTimeEntry)}
                </span>
              </SidebarMenuButton>
            )}
          </>
        )}

        {/* Feedback Button */}
        <div className="mt-4 border-t border-tracksy-gold/20 pt-4">
          <SidebarMenuButton
            onClick={openFeedbackLink}
            className="hover:text-purple-600"
            tooltip="Share your feedback"
          >
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span className="text-base text-muted-foreground">Send Feedback</span>
          </SidebarMenuButton>
        </div>
      </>
    </>
  );
}

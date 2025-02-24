import { useState, useEffect } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
  useLastTimeEntry,
} from "@/hooks/useTimeEntryQueries";
import { PlayCircle, StopCircle, Focus, History, Coffee } from "lucide-react";
import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { breakDurationAtom } from "@/context/board";
import { NotificationOptions } from "@/types/notification";

export function BottomSideBar() {
  const [duration, setDuration] = useState<string>("00:00:00");
  const [durationInMinutes, setDurationInMinutes] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [breakDuration, setBreakDuration] = useAtom(breakDurationAtom);

  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const { data: lastTimeEntry = null } = useLastTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  const sendNotification = async (options: NotificationOptions) => {
    try {
      await trpcClient.notification.sendNotification.mutate(options);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry) {
      const updateDuration = () => {
        const startTime = new Date(activeTimeEntry.startTime).getTime();
        const now = new Date().getTime();
        const diff = now - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setDurationInMinutes(hours * 60 + minutes);
        setDuration(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      updateDuration();
      intervalId = setInterval(updateDuration, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry]);

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

      // Show toast notification
      toast({
        title: `${breakDuration} minute break started! 🎉`,
        description: "You've earned it! Time entry has been stopped.",
      });

      // Send system notification
      await sendNotification({
        body: "Time to get back to work! Open iTracksy to start tracking again.",
        requireInteraction: true,
        title: "Break Time's Over! 🚀",
        timeoutMs: breakDuration * 60 * 1000,
      });

      // Set up break end notification
      const timeoutId = setTimeout(
        async () => {
          // Show toast notification
          toast({
            title: "Break time's over! 🚀",
            description:
              "Time to get back to work! Click 'Let's get shit done!' to start tracking again.",
            duration: 10000, // Show for 10 seconds
          });
        },
        breakDuration * 60 * 1000
      );

      // Clean up timeout if component unmounts
      return () => clearTimeout(timeoutId);
    } catch (error) {
      toast({
        title: "Failed to stop time entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleResumeLastTask = () => {
    if (!lastTimeEntry?.item) {
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
        isFocusMode: false,
      },
      {
        onSuccess: () => {
          toast({
            title: "Resumed task",
            description: `Now tracking: ${lastTimeEntry?.item?.title}`,
          });
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

  return (
    <>
      <TimeEntryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

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
                <span>{activeTimeEntry.item?.title || activeTimeEntry.description}</span>
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
              onClick={() => setIsDialogOpen(true)}
              className="hover:text-green-600"
              tooltip="Let's get shit done! "
            >
              <PlayCircle className="h-6 w-6 text-green-600" />
              <span className="text-base text-muted-foreground">Let's get shit done! </span>
            </SidebarMenuButton>

            {lastTimeEntry && lastTimeEntry.item?.title && (
              <SidebarMenuButton
                onClick={handleResumeLastTask}
                className="hover:text-blue-600"
                tooltip={`Resume: ${lastTimeEntry.item?.title || "last task"}`}
              >
                <History className="h-5 w-5 text-blue-600" />
                <span className="text-base text-muted-foreground">
                  Resume: {lastTimeEntry.item?.title}
                </span>
              </SidebarMenuButton>
            )}
          </>
        )}
      </>
    </>
  );
}

import { getTitleTimeEntry } from "@/api/db/timeEntryExt";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { TimeEntryWithRelations } from "@/types/projects";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Cloud, Clock, AlertTriangle, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { BoardSelector } from "@/components/tracking/BoardSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAtom } from "jotai";
import { selectedBoardIdAtom, selectedItemIdAtom } from "@/context/board";

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

export const ActiveSession: React.FC<{ activeTimeEntry: TimeEntryWithRelations }> = ({
  activeTimeEntry,
}) => {
  const navigate = useNavigate();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const { toast } = useToast();
  const [duration, setDuration] = useState<string>("00:00");
  const [isTimeExceeded, setIsTimeExceeded] = useState(false);
  const [warningMessage, setWarningMessage] = useState(warningMessages[0]);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
  const queryClient = useQueryClient();

  const handleExtendTime = async () => {
    if (!activeTimeEntry) return;

    try {
      const newTargetDuration = (activeTimeEntry.targetDuration ?? 0) + 5;
      await updateTimeEntry.mutateAsync({
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
      await updateTimeEntry.mutateAsync({
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
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        boardId: selectedBoardId,
        itemId: selectedItemId,
      });

      toast({
        title: "Task Assigned",
        description: "Task has been successfully assigned to this session.",
      });
      setShowTaskAssignment(false);
    } catch (error) {
      toast({
        title: "Failed to assign task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry) {
      const updateTimer = () => {
        const now = new Date();
        const startTimeDate = new Date(activeTimeEntry.startTime);
        const minutes = activeTimeEntry.targetDuration ?? 0;
        const secondsDiff =
          minutes * 60 - Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);

        // Format time differently for negative values
        if (secondsDiff <= 0) {
          const absDiff = Math.abs(secondsDiff);
          const mins = Math.floor(absDiff / 60);
          const secs = absDiff % 60;

          // Only stop if autoStopEnabled is true
          if (secondsDiff < 0 && activeTimeEntry.autoStopEnabled) {
            queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
            setDuration("00:00");
            setIsTimeExceeded(false);
            return;
          } else {
            setDuration(`-${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
            setIsTimeExceeded(true);
            // Change message every 60 seconds when time is exceeded
            const messageIndex = Math.floor(Math.abs(secondsDiff) / 60) % warningMessages.length;
            setWarningMessage(warningMessages[messageIndex]);
          }
        } else {
          const mins = Math.floor(secondsDiff / 60);
          const secs = secondsDiff % 60;
          setDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
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
  }, [activeTimeEntry]);

  return (
    <>
      {/* Active Session Display */}
      <div className="text-center">
        <h2 className="mb-4 text-xl font-medium text-[#2B4474] dark:text-white">Current Session</h2>
        <div className="rounded-lg border border-[#E5A853]/20 bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center justify-center gap-2 text-[#2B4474] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#E5A853]"></span>
            {getTitleTimeEntry(activeTimeEntry)}
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative mx-auto aspect-square w-64">
        <div className="absolute inset-0 rounded-full border-[16px] border-[#E5A853]/20"></div>
        <div
          className="absolute inset-0 rounded-full border-[16px] border-[#E5A853]"
          style={{
            clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos(Math.PI / 2)}% ${50 - 50 * Math.sin(Math.PI / 2)}%)`,
          }}
        ></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="font-mono text-4xl font-medium text-[#2B4474] dark:text-white">
            {duration}
          </span>
          {isTimeExceeded && (
            <div className="flex flex-col items-center space-y-1">
              <AlertTriangle className="h-5 w-5 animate-bounce text-[#E5A853]" />
              <span
                className="text-sm font-medium text-[#E5A853] transition-all duration-300"
                style={{
                  animation: "warning 2s infinite",
                }}
              >
                {warningMessage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex space-x-4 pt-8">
        {/* Extend Time Button */}
        <Button onClick={handleExtendTime} variant="outline" className="flex-1">
          +5 MINUTES
        </Button>
        <Button onClick={handleStopTimeEntry} variant="default" className="flex-1">
          STOP {activeTimeEntry.isFocusMode ? "FOCUS" : "BREAK"}
        </Button>
      </div>

      {/* Raining Letters Button */}
      {!activeTimeEntry.isFocusMode && (
        <button
          onClick={() => navigate({ to: "/raining-letters" })}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-[#2B4474] to-[#E5A853] p-4 font-medium text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#E5A853]/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2B4474] to-[#E5A853] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Cloud className="h-6 w-6 animate-bounce transition-transform duration-300 group-hover:scale-110" />
          <span className="relative z-10 text-lg font-bold text-white">Take a Magical Break</span>
          <div className="absolute -inset-1 -z-10 animate-pulse opacity-25 blur">
            <div className="h-full w-full bg-gradient-to-r from-[#2B4474] via-[#3d5990] to-[#E5A853]" />
          </div>
        </button>
      )}

      {/* Task Assignment Section */}
      {activeTimeEntry.isFocusMode && (
        <Card className="shadow-sm">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTaskAssignment(!showTaskAssignment)}
                  >
                    {showTaskAssignment ? "Cancel" : "Change Task"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTaskAssignment(!showTaskAssignment)}
                >
                  {showTaskAssignment ? "Cancel" : "Assign Task"}
                </Button>
              )}
            </div>
          </CardHeader>
          {showTaskAssignment && (
            <CardContent className="space-y-3">
              <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
              <div className="flex gap-2">
                <Button onClick={handleAssignTask} className="flex-1">
                  Assign Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTaskAssignment(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
};

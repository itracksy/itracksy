import { useState, useEffect } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
  useLastTimeEntry,
} from "@/hooks/useTimeEntryQueries";

import { useToast } from "@/hooks/use-toast";
import { trpcClient } from "@/utils/trpc";
import { useAtom } from "jotai";
import { breakDurationAtom, selectedBoardIdAtom, targetMinutesAtom } from "@/context/board";

import { BoardSelector } from "@/components/tracking/BoardSelector";
import { Slider } from "@/components/ui/slider";

export default function FocusPage() {
  const [intention, setIntention] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedBoardId] = useAtom(selectedBoardIdAtom);

  const [targetMinutes, setTargetMinutes] = useAtom(targetMinutesAtom);
  const [duration, setDuration] = useState<string>(`${targetMinutes}:00`);
  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry) {
      const updateTimer = () => {
        const now = new Date();
        const startTimeDate = new Date(activeTimeEntry.startTime);
        const diff =
          targetMinutes * 60 - Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);

        if (diff <= 0) {
          clearInterval(intervalId);
          handleStopTimeEntry();

          // Send notification when time is up

          return;
        }

        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setDuration(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry, targetMinutes]);

  // Update initial duration when target minutes changes
  useEffect(() => {
    if (!activeTimeEntry) {
      setDuration(`${targetMinutes.toString().padStart(2, "0")}:00`);
    }
  }, [targetMinutes, activeTimeEntry]);

  const handleStartSession = async (withTask: boolean = false) => {
    if (!withTask && !intention) {
      toast({
        title: "Please set an intention",
        description: "Enter what you want to focus on before starting the session.",
        variant: "destructive",
      });
      return;
    }

    if (withTask && !selectedItemId) {
      toast({
        title: "Please select a task",
        description: "Choose a task from the board before starting the session.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();

    try {
      await createTimeEntry.mutateAsync({
        startTime: now.toISOString(),
        description: withTask ? undefined : intention,
        boardId: withTask ? selectedBoardId : undefined,
        itemId: withTask ? selectedItemId : undefined,
        targetDuration: targetMinutes,
        isFocusMode: true,
      });

      toast({
        title: "Focus Session Started",
        description: `Your ${targetMinutes}-minute focus session has begun. Stay focused!`,
      });

      // Send start notification
      trpcClient.notification.sendNotification.mutate({
        title: "Focus Session Complete! ",
        body: `Great work! Your ${targetMinutes}-minute focus session is complete. Take a short break before starting another session.`,
        timeoutMs: targetMinutes * 60 * 1000,
      });
    } catch (error) {
      toast({
        title: "Failed to start focus session",
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
        endTime: new Date().toISOString(),
      });

      toast({
        title: "Focus session completed",
        description: "Great work! Your time has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Failed to stop focus session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const formatTimeRange = () => {
    if (!activeTimeEntry) return "";
    return `${new Date(activeTimeEntry.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} → ${new Date(activeTimeEntry.endTime ?? "").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-pink-50 p-8">
      <div className="w-full max-w-md space-y-8">
        {activeTimeEntry ? (
          <>
            {/* Active Session Display */}
            <div className="text-center">
              <h2 className="mb-4 text-xl font-medium text-gray-700">Current Focus Session</h2>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-green-400"></span>
                  {activeTimeEntry.item?.title || activeTimeEntry.description || "Focus Session"}
                </div>
              </div>
            </div>

            {/* Timer Display */}
            <div className="relative mx-auto aspect-square w-64">
              <div className="absolute inset-0 rounded-full border-[16px] border-pink-100"></div>
              <div
                className="absolute inset-0 rounded-full border-[16px] border-green-400"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos(Math.PI / 2)}% ${50 - 50 * Math.sin(Math.PI / 2)}%)`,
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-4xl font-medium text-gray-700">{duration}</span>
              </div>
            </div>

            {/* Stop Button */}
            <button
              onClick={handleStopTimeEntry}
              className="w-full rounded-lg bg-red-400 py-3 font-medium text-white shadow-sm transition hover:bg-red-500"
            >
              STOP SESSION
            </button>
          </>
        ) : (
          <>
            {/* Timer Display */}
            <div className="relative mx-auto aspect-square w-64">
              <div className="absolute inset-0 rounded-full border-[16px] border-pink-100"></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-red-400"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-4xl font-medium text-gray-700">{duration}</span>
              </div>
            </div>
            {/* Duration Slider */}
            <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Session Duration</label>
                <span className="font-mono text-sm text-gray-500">{targetMinutes} minutes</span>
              </div>
              <Slider
                value={[targetMinutes]}
                onValueChange={(values) => setTargetMinutes(values[0])}
                min={5}
                max={60}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5m</span>
                <span>60m</span>
              </div>
            </div>
            {/* Time Range */}
            <div className="text-center font-mono text-sm text-gray-500">{formatTimeRange()}</div>

            {/* Start Buttons */}
            <div className="space-y-3">
              {/* Board Selector */}
              <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
                <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
              </div>
              <button
                onClick={() => handleStartSession(true)}
                disabled={!!activeTimeEntry}
                className="w-full rounded-lg bg-red-400 py-3 font-medium text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
              >
                START WITH TASK
              </button>
              {/* Intention Input */}
              <input
                type="text"
                placeholder="Intention (for quick focus without task)"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="w-full rounded-lg bg-white/80 px-4 py-2 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                onClick={() => handleStartSession(false)}
                disabled={!!activeTimeEntry}
                className="w-full rounded-lg border border-red-400 bg-white py-3 font-medium text-red-400 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
              >
                QUICK FOCUS
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

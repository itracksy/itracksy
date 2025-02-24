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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Coffee } from "lucide-react";

export default function FocusPage() {
  const [intention, setIntention] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedBoardId] = useAtom(selectedBoardIdAtom);
  const [targetMinutes, setTargetMinutes] = useAtom(targetMinutesAtom);
  const [breakMinutes, setBreakMinutes] = useAtom(breakDurationAtom);
  const [duration, setDuration] = useState<string>(`${targetMinutes}:00`);
  const [activeTab, setActiveTab] = useState<"focus" | "break">("focus");

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
        const minutes = activeTimeEntry.isFocusMode ? targetMinutes : breakMinutes;
        const diff = minutes * 60 - Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);

        if (diff <= 0) {
          clearInterval(intervalId);
          handleStopTimeEntry();

          // Send notification when time is up

          return;
        }

        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry, targetMinutes, breakMinutes]);

  useEffect(() => {
    if (!activeTimeEntry) {
      const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
      setDuration(`${minutes.toString().padStart(2, "0")}:00`);
    }
  }, [targetMinutes, breakMinutes, activeTab, activeTimeEntry]);

  const handleStartSession = async () => {
    if (activeTab === "focus" && !intention && !selectedItemId) {
      toast({
        title: "Please set an intention or select a task",
        description:
          "Enter what you want to focus on or choose a task before starting the session.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
    const { description, boardId, itemId } = getTimeEntryData();
    try {
      await createTimeEntry.mutateAsync({
        startTime: now.toISOString(),
        description,
        boardId,
        itemId,
        targetDuration: minutes,
        isFocusMode: activeTab === "focus",
      });

      const mode = activeTab === "focus" ? "Focus" : "Break";
      toast({
        title: `${mode} Session Started`,
        description: `Your ${minutes}-minute ${mode.toLowerCase()} session has begun.`,
      });

      trpcClient.notification.sendNotification.mutate({
        title: `${mode} Session Complete! `,
        body: `Great work! Your ${minutes}-minute ${mode.toLowerCase()} session is complete. Take a short break before starting another session.`,
        timeoutMs: minutes * 60 * 1000,
      });
    } catch (error) {
      toast({
        title: "Failed to start session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }

    function getTimeEntryData(): {
      boardId: string | undefined;
      itemId: string | undefined;
      description: string | undefined;
    } {
      if (activeTab === "focus") {
        if (intention) {
          return {
            boardId: undefined,
            itemId: undefined,
            description: intention,
          };
        }
        return {
          boardId: selectedBoardId,
          itemId: selectedItemId,
          description: undefined,
        };
      }

      return { boardId: undefined, itemId: undefined, description: "Break Time" };
    }
  };

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: new Date().toISOString(),
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

  const formatTimeRange = () => {
    if (!activeTimeEntry) return "";
    return `${new Date(activeTimeEntry.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} → ${new Date(activeTimeEntry.endTime ?? "").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  };
  console.log(activeTimeEntry);
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white via-red-50/30 to-red-100/20 p-8 dark:from-gray-900 dark:via-red-900/10 dark:to-red-900/5">
      <div className="w-full max-w-md space-y-8">
        {activeTimeEntry ? (
          <>
            {/* Active Session Display */}
            <div className="text-center">
              <h2 className="mb-4 text-xl font-medium text-gray-700">Current Session</h2>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-green-400"></span>
                  {activeTimeEntry.item?.title || activeTimeEntry.description}
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "focus" | "break")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="focus" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Focus
                </TabsTrigger>
                <TabsTrigger value="break" className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Break
                </TabsTrigger>
              </TabsList>

              <TabsContent value="focus" className="space-y-4">
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
                    <label className="text-sm font-medium text-gray-700">Focus Duration</label>
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

                {/* Board Selector */}
                <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
                  <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
                </div>

                {/* Intention Input */}
                <input
                  type="text"
                  placeholder="Intention (for quick focus without task)"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  className="w-full rounded-lg bg-white/80 px-4 py-2 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </TabsContent>

              <TabsContent value="break" className="space-y-4">
                {/* Timer Display */}
                <div className="relative mx-auto aspect-square w-64">
                  <div className="absolute inset-0 rounded-full border-[16px] border-pink-100"></div>
                  <div className="absolute inset-0 rounded-full border-[16px] border-blue-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-4xl font-medium text-gray-700">{duration}</span>
                  </div>
                </div>

                {/* Break Duration Slider */}
                <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Break Duration</label>
                    <span className="font-mono text-sm text-gray-500">{breakMinutes} minutes</span>
                  </div>
                  <Slider
                    value={[breakMinutes]}
                    onValueChange={(values) => setBreakMinutes(values[0])}
                    min={1}
                    max={30}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1m</span>
                    <span>30m</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Time Range */}
            <div className="text-center font-mono text-sm text-gray-500">{formatTimeRange()}</div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={!!activeTimeEntry}
              className="w-full rounded-lg bg-red-400 py-3 font-medium text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
            >
              START {activeTab === "focus" ? "FOCUS" : "BREAK"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  useActiveTimeEntry,
  useCreateTimeEntryMutation,
  useLastTimeEntry,
} from "@/hooks/useTimeEntryQueries";
import { useToast } from "@/hooks/use-toast";

import { useAtom } from "jotai";
import {
  autoStopEnabledsAtom,
  breakDurationAtom,
  selectedBoardIdAtom,
  targetMinutesAtom,
  isUnlimitedFocusAtom,
} from "@/context/board";

import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brain, Coffee, History } from "lucide-react";
import { ActiveSession } from "./components/ActiveSession";
import { FocusTargetWidget } from "./components/FocusTargetWidget";
import { SessionReviewDialog } from "./components/SessionReviewDialog";

export default function FocusPage() {
  const [targetMinutes, setTargetMinutes] = useAtom(targetMinutesAtom);
  const [breakMinutes, setBreakMinutes] = useAtom(breakDurationAtom);
  const [duration, setDuration] = useState<string>(`${targetMinutes}:00`);
  const [activeTab, setActiveTab] = useState<"focus" | "break">("focus");
  const [autoStopEnabled] = useAtom(autoStopEnabledsAtom);
  const [isUnlimitedFocus, setIsUnlimitedFocus] = useAtom(isUnlimitedFocusAtom);
  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { data: lastTimeEntry } = useLastTimeEntry();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeTimeEntry) {
      const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
      // Only focus sessions can be unlimited, breaks always have a duration
      const isUnlimited = activeTab === "focus" && isUnlimitedFocus;

      if (isUnlimited) {
        setDuration("∞");
      } else {
        setDuration(`${minutes.toString().padStart(2, "0")}:00`);
      }
    } else {
      if (lastTimeEntry) {
        setActiveTab(lastTimeEntry.isFocusMode ? "break" : "focus");
      }
    }
  }, [targetMinutes, breakMinutes, activeTab, activeTimeEntry, lastTimeEntry, isUnlimitedFocus]);

  const handleStartSession = async () => {
    // Only focus sessions can be unlimited, breaks always have a duration
    const isUnlimited = activeTab === "focus" && isUnlimitedFocus;
    const minutes = isUnlimited ? 0 : activeTab === "focus" ? targetMinutes : breakMinutes;
    const { description, boardId, itemId } = getTimeEntryData();

    try {
      await createTimeEntry.mutateAsync({
        startTime: Date.now(),
        description,
        boardId,
        itemId,
        targetDuration: minutes,
        isFocusMode: activeTab === "focus",
        autoStopEnabled: isUnlimited ? false : autoStopEnabled, // Disable auto-stop for unlimited sessions
      });

      const mode = activeTab === "focus" ? "Focus" : "Break";
      const durationText = isUnlimited ? "unlimited" : `${minutes}-minute`;
      toast({
        title: `${mode} Session Started`,
        description: `Your ${durationText} ${mode.toLowerCase()} session has begun.`,
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
        // Default case - no task selected, just start focus session
        return {
          boardId: undefined,
          itemId: undefined,
          description: "Focus Session",
        };
      }

      return { boardId: undefined, itemId: undefined, description: "Break Time" };
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-transparent p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Focus Target Widget - always shown */}
        <FocusTargetWidget />

        {/* Session Review Button */}
        {(activeTimeEntry || lastTimeEntry?.isFocusMode) && (
          <SessionReviewDialog
            session={activeTimeEntry || (lastTimeEntry?.isFocusMode ? lastTimeEntry : null)}
            trigger={
              <Button variant="outline" size="sm" className="w-full gap-2">
                <History className="h-4 w-4" />
                {activeTimeEntry ? "Review Current Session" : "Review Last Session"}
              </Button>
            }
          />
        )}

        {activeTimeEntry ? (
          <ActiveSession activeTimeEntry={activeTimeEntry} />
        ) : (
          <>
            <div>
              <div className="pt-0">
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

                  <TabsContent value="focus" className="space-y-4 pt-2">
                    {/* Mode Selector - Timed vs Unlimited */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsUnlimitedFocus(false)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                          !isUnlimitedFocus
                            ? "border-[#E5A853] bg-[#E5A853]/10"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                        }`}
                      >
                        <span className="text-lg font-semibold text-gray-700 dark:text-white">
                          ⏱️ Timed
                        </span>
                        <span className="text-xs text-gray-500">Set a duration</span>
                      </button>
                      <button
                        onClick={() => setIsUnlimitedFocus(true)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                          isUnlimitedFocus
                            ? "border-[#E5A853] bg-[#E5A853]/10"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                        }`}
                      >
                        <span className="text-lg font-semibold text-gray-700 dark:text-white">
                          ∞ Unlimited
                        </span>
                        <span className="text-xs text-gray-500">Track all day</span>
                      </button>
                    </div>

                    {/* Timer Display */}
                    <div className="relative mx-auto aspect-square w-36">
                      <div className="absolute inset-0 rounded-full border-[12px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[12px] border-[#E5A853]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-3xl font-medium text-gray-700 dark:text-white">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Duration Slider - Only for timed mode */}
                    {!isUnlimitedFocus ? (
                      <Card className="shadow-sm">
                        <CardContent className="px-4 py-3">
                          <div className="mb-2 flex items-center justify-between">
                            <Label className="text-sm font-medium">Duration</Label>
                            <span className="font-mono text-sm text-gray-500">
                              {targetMinutes} minutes
                            </span>
                          </div>
                          <Slider
                            value={[targetMinutes]}
                            onValueChange={(values) => setTargetMinutes(values[0])}
                            min={5}
                            max={480}
                            step={5}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>5m</span>
                            <span>8h</span>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#E5A853]/50 bg-[#E5A853]/5 p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Continuous Background Tracking
                          </span>
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-gray-500">
                          <li>• Runs silently in the background</li>
                          <li>• Auto-starts with app if enabled in System Settings</li>
                          <li>• Tracks all your activities throughout the day</li>
                          <li>• Stop manually when you're done working</li>
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="break" className="space-y-3 pt-2">
                    {/* Timer Display - Compact like Focus tab */}
                    <div className="relative mx-auto aspect-square w-36">
                      <div className="absolute inset-0 rounded-full border-[12px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[12px] border-[#2B4474]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-3xl font-medium text-gray-700 dark:text-white">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Break Duration Slider - Compact */}
                    <Card className="shadow-sm">
                      <CardContent className="px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-sm font-medium">Break Duration</Label>
                          <span className="font-mono text-sm text-gray-500">
                            {breakMinutes} minutes
                          </span>
                        </div>
                        <Slider
                          value={[breakMinutes]}
                          onValueChange={(values) => setBreakMinutes(values[0])}
                          min={1}
                          max={60}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1m</span>
                          <span>1h</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartSession}
              disabled={!!activeTimeEntry}
              className="w-full bg-[#E5A853] py-6 text-white hover:bg-[#d09641]"
              size="lg"
            >
              START {activeTab === "focus" ? "FOCUS" : "BREAK"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

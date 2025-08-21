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
  isUnlimitedBreakAtom,
} from "@/context/board";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brain, Coffee } from "lucide-react";
import { ActiveSession } from "./components/ActiveSession";
import { FocusTargetWidget } from "./components/FocusTargetWidget";

export default function FocusPage() {
  const [targetMinutes, setTargetMinutes] = useAtom(targetMinutesAtom);
  const [breakMinutes, setBreakMinutes] = useAtom(breakDurationAtom);
  const [duration, setDuration] = useState<string>(`${targetMinutes}:00`);
  const [activeTab, setActiveTab] = useState<"focus" | "break">("focus");
  const [autoStopEnabled, setAutoStopEnabled] = useAtom(autoStopEnabledsAtom);
  const [isUnlimitedFocus, setIsUnlimitedFocus] = useAtom(isUnlimitedFocusAtom);
  const [isUnlimitedBreak, setIsUnlimitedBreak] = useAtom(isUnlimitedBreakAtom);
  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { data: lastTimeEntry } = useLastTimeEntry();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeTimeEntry) {
      const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
      const isUnlimited = activeTab === "focus" ? isUnlimitedFocus : isUnlimitedBreak;

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
  }, [
    targetMinutes,
    breakMinutes,
    activeTab,
    activeTimeEntry,
    lastTimeEntry,
    isUnlimitedFocus,
    isUnlimitedBreak,
  ]);

  const handleStartSession = async () => {
    const isUnlimited = activeTab === "focus" ? isUnlimitedFocus : isUnlimitedBreak;
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

                  <TabsContent value="focus" className="space-y-3 pt-2">
                    {/* Timer Display - Reduced size */}
                    <div className="relative mx-auto aspect-square w-36">
                      <div className="absolute inset-0 rounded-full border-[12px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[12px] border-[#E5A853]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-3xl font-medium text-gray-700 dark:text-white">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Duration Slider - More compact */}
                    <Card className="shadow-sm">
                      <CardContent className="px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-sm font-medium">Focus Duration</Label>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">
                              {isUnlimitedFocus ? "Unlimited" : `${targetMinutes} minutes`}
                            </span>
                            <div className="flex items-center gap-1">
                              <Label htmlFor="unlimited-focus" className="text-xs text-gray-500">
                                ∞
                              </Label>
                              <Switch
                                id="unlimited-focus"
                                checked={isUnlimitedFocus}
                                onCheckedChange={setIsUnlimitedFocus}
                              />
                            </div>
                          </div>
                        </div>
                        {!isUnlimitedFocus && (
                          <>
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
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="break" className="space-y-4 pt-4">
                    {/* Timer Display */}
                    <div className="relative mx-auto aspect-square w-48">
                      <div className="absolute inset-0 rounded-full border-[16px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[16px] border-[#2B4474]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-4xl font-medium text-gray-700 dark:text-white">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Break Duration Slider */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-sm font-medium">Break Duration</Label>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-500">
                              {isUnlimitedBreak ? "Unlimited" : `${breakMinutes} minutes`}
                            </span>
                            <div className="flex items-center gap-1">
                              <Label htmlFor="unlimited-break" className="text-xs text-gray-500">
                                ∞
                              </Label>
                              <Switch
                                id="unlimited-break"
                                checked={isUnlimitedBreak}
                                onCheckedChange={setIsUnlimitedBreak}
                              />
                            </div>
                          </div>
                        </div>
                        {!isUnlimitedBreak && (
                          <>
                            <Slider
                              value={[breakMinutes]}
                              onValueChange={(values) => setBreakMinutes(values[0])}
                              min={1}
                              max={120}
                              step={1}
                              className="py-4"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>1m</span>
                              <span>2h</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Start Button */}

            <div className="pt-0">
              <Button
                onClick={handleStartSession}
                disabled={!!activeTimeEntry}
                className="w-full bg-[#E5A853] py-6 text-white hover:bg-[#d09641]"
                size="lg"
              >
                START {activeTab === "focus" ? "FOCUS" : "BREAK"}
              </Button>

              <div className="mt-4 flex items-center justify-between">
                <Label className="text-xs text-gray-500">
                  Auto-stop timer
                  {(activeTab === "focus" ? isUnlimitedFocus : isUnlimitedBreak) && (
                    <span className="ml-1 text-orange-500">(disabled for unlimited sessions)</span>
                  )}
                </Label>
                <Switch
                  checked={
                    autoStopEnabled &&
                    !(activeTab === "focus" ? isUnlimitedFocus : isUnlimitedBreak)
                  }
                  onCheckedChange={setAutoStopEnabled}
                  disabled={activeTab === "focus" ? isUnlimitedFocus : isUnlimitedBreak}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

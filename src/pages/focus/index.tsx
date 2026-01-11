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
  targetMinutesAtom,
  isUnlimitedFocusAtom,
} from "@/context/board";

import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brain, Coffee, History, Play, Timer, Infinity } from "lucide-react";
import { ActiveSession } from "./components/ActiveSession";
import { FocusTargetWidget } from "./components/FocusTargetWidget";
import { SessionReviewDialog } from "./components/SessionReviewDialog";
import { ActivityHeatmap } from "@/pages/dashboard/components/ActivityHeatmap";
import { cn } from "@/lib/utils";

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
        autoStopEnabled: isUnlimited ? false : autoStopEnabled,
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
        return {
          boardId: undefined,
          itemId: undefined,
          description: "Focus Session",
        };
      }

      return { boardId: undefined, itemId: undefined, description: "Break Time" };
    }
  };

  // If there's an active session, show it prominently
  if (activeTimeEntry) {
    return (
      <div className="min-h-screen bg-transparent p-6 md:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr,400px] lg:gap-12">
            {/* Active Session */}
            <div className="flex flex-col items-center justify-center">
              <ActiveSession activeTimeEntry={activeTimeEntry} />
              {/* Session Review Button */}
              <SessionReviewDialog
                session={activeTimeEntry}
                trigger={
                  <Button variant="outline" size="sm" className="mt-6 gap-2">
                    <History className="h-4 w-4" />
                    Review Current Session
                  </Button>
                }
              />
            </div>

            {/* Right Column - Stats & Heatmap */}
            <div className="space-y-6">
              <FocusTargetWidget />
              <ActivityHeatmap compact />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr,400px] lg:gap-12">
          {/* Left Column - Timer Controls */}
          <div className="flex flex-col">
            {/* Mode Toggle - Focus/Break */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-full bg-muted p-1">
                <button
                  onClick={() => setActiveTab("focus")}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all",
                    activeTab === "focus"
                      ? "bg-[#E5A853] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Brain className="h-4 w-4" />
                  Focus
                </button>
                <button
                  onClick={() => setActiveTab("break")}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all",
                    activeTab === "break"
                      ? "bg-[#2B4474] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Coffee className="h-4 w-4" />
                  Break
                </button>
              </div>
            </div>

            {/* Timer Display - Hero Element */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="relative">
                {/* Outer glow effect */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full opacity-20 blur-2xl",
                    activeTab === "focus" ? "bg-[#E5A853]" : "bg-[#2B4474]"
                  )}
                />

                {/* Timer circle */}
                <div
                  className={cn(
                    "relative flex h-56 w-56 items-center justify-center rounded-full border-[12px] md:h-64 md:w-64",
                    activeTab === "focus"
                      ? "border-[#E5A853] bg-[#E5A853]/5"
                      : "border-[#2B4474] bg-[#2B4474]/5"
                  )}
                >
                  <span className="font-mono text-5xl font-bold text-foreground md:text-6xl">
                    {duration}
                  </span>
                </div>
              </div>

              {/* Session Type Toggle (Focus only) */}
              {activeTab === "focus" && (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsUnlimitedFocus(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                      !isUnlimitedFocus
                        ? "border-[#E5A853] bg-[#E5A853]/10 text-[#E5A853]"
                        : "border-muted bg-transparent text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    <Timer className="h-4 w-4" />
                    Timed
                  </button>
                  <button
                    onClick={() => setIsUnlimitedFocus(true)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                      isUnlimitedFocus
                        ? "border-[#E5A853] bg-[#E5A853]/10 text-[#E5A853]"
                        : "border-muted bg-transparent text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    <Infinity className="h-4 w-4" />
                    Unlimited
                  </button>
                </div>
              )}

              {/* Duration Slider */}
              {(activeTab === "break" || (activeTab === "focus" && !isUnlimitedFocus)) && (
                <div className="mt-6 w-full max-w-xs">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Label className="text-muted-foreground">Duration</Label>
                    <span className="font-mono font-medium">
                      {activeTab === "focus" ? targetMinutes : breakMinutes} min
                    </span>
                  </div>
                  <Slider
                    value={[activeTab === "focus" ? targetMinutes : breakMinutes]}
                    onValueChange={(values) =>
                      activeTab === "focus"
                        ? setTargetMinutes(values[0])
                        : setBreakMinutes(values[0])
                    }
                    min={activeTab === "focus" ? 5 : 1}
                    max={activeTab === "focus" ? 480 : 60}
                    step={activeTab === "focus" ? 5 : 1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{activeTab === "focus" ? "5m" : "1m"}</span>
                    <span>{activeTab === "focus" ? "8h" : "1h"}</span>
                  </div>
                </div>
              )}

              {/* Unlimited Mode Description */}
              {activeTab === "focus" && isUnlimitedFocus && (
                <p className="mt-6 max-w-xs text-center text-sm text-muted-foreground">
                  Track your activities throughout the day. Stop manually when done.
                </p>
              )}

              {/* Start Button */}
              <Button
                onClick={handleStartSession}
                size="lg"
                className={cn(
                  "mt-8 gap-2 px-12 py-6 text-lg font-semibold",
                  activeTab === "focus"
                    ? "bg-[#E5A853] hover:bg-[#d09641]"
                    : "bg-[#2B4474] hover:bg-[#1e3357]"
                )}
              >
                <Play className="h-5 w-5" />
                Start {activeTab === "focus" ? "Focus" : "Break"}
              </Button>

              {/* Session Review (if last session exists) */}
              {lastTimeEntry?.isFocusMode && (
                <SessionReviewDialog
                  session={lastTimeEntry}
                  trigger={
                    <Button variant="ghost" size="sm" className="mt-4 gap-2 text-muted-foreground">
                      <History className="h-4 w-4" />
                      Review Last Session
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {/* Right Column - Stats & Heatmap */}
          <div className="space-y-6">
            <FocusTargetWidget />
            <ActivityHeatmap compact />
          </div>
        </div>
      </div>
    </div>
  );
}

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
} from "@/context/board";

import { BoardSelector } from "@/components/tracking/BoardSelector";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Brain, Coffee } from "lucide-react";
import { ActiveSession } from "./components/ActiveSession";

export default function FocusPage() {
  const [intention, setIntention] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedBoardId] = useAtom(selectedBoardIdAtom);
  const [targetMinutes, setTargetMinutes] = useAtom(targetMinutesAtom);
  const [breakMinutes, setBreakMinutes] = useAtom(breakDurationAtom);
  const [duration, setDuration] = useState<string>(`${targetMinutes}:00`);
  const [activeTab, setActiveTab] = useState<"focus" | "break">("focus");
  const [autoStopEnabled, setAutoStopEnabled] = useAtom(autoStopEnabledsAtom);
  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { data: lastTimeEntry } = useLastTimeEntry();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeTimeEntry) {
      const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
      setDuration(`${minutes.toString().padStart(2, "0")}:00`);
    } else {
      if (lastTimeEntry) {
        setActiveTab(lastTimeEntry.isFocusMode ? "break" : "focus");
      }
    }
  }, [targetMinutes, breakMinutes, activeTab, activeTimeEntry, lastTimeEntry]);

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

    const minutes = activeTab === "focus" ? targetMinutes : breakMinutes;
    const { description, boardId, itemId } = getTimeEntryData();
    try {
      await createTimeEntry.mutateAsync({
        startTime: Date.now(),
        description,
        boardId,
        itemId,
        targetDuration: minutes,
        isFocusMode: activeTab === "focus",
        autoStopEnabled,
      });

      const mode = activeTab === "focus" ? "Focus" : "Break";
      toast({
        title: `${mode} Session Started`,
        description: `Your ${minutes}-minute ${mode.toLowerCase()} session has begun.`,
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-transparent p-4">
      <div className="w-full max-w-md space-y-6">
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

                  <TabsContent value="focus" className="space-y-4 pt-4">
                    {/* Timer Display */}
                    <div className="relative mx-auto aspect-square w-48">
                      <div className="absolute inset-0 rounded-full border-[16px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[16px] border-[#E5A853]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-4xl font-medium text-gray-700">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Duration Slider */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Focus Duration</Label>
                          <span className="font-mono text-sm text-gray-500">
                            {targetMinutes} minutes
                          </span>
                        </div>
                        <Slider
                          value={[targetMinutes]}
                          onValueChange={(values) => setTargetMinutes(values[0])}
                          min={5}
                          max={60}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>5m</span>
                          <span>60m</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Task Selection */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          What are you working on?
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <BoardSelector
                          selectedItemId={selectedItemId}
                          onItemSelect={setSelectedItemId}
                        />

                        <div className="flex items-center gap-2 py-1">
                          <Separator className="flex-1" />
                          <span className="text-xs text-gray-500">OR</span>
                          <Separator className="flex-1" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">
                            Intention (for quick focus without task)
                          </Label>
                          <Input
                            placeholder="What do you want to focus on?"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="break" className="space-y-4 pt-4">
                    {/* Timer Display */}
                    <div className="relative mx-auto aspect-square w-48">
                      <div className="absolute inset-0 rounded-full border-[16px] border-gray-100"></div>
                      <div className="absolute inset-0 rounded-full border-[16px] border-[#2B4474]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-4xl font-medium text-gray-700">
                          {duration}
                        </span>
                      </div>
                    </div>

                    {/* Break Duration Slider */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Break Duration</Label>
                          <span className="font-mono text-sm text-gray-500">
                            {breakMinutes} minutes
                          </span>
                        </div>
                        <Slider
                          value={[breakMinutes]}
                          onValueChange={(values) => setBreakMinutes(values[0])}
                          min={1}
                          max={30}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1m</span>
                          <span>30m</span>
                        </div>
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
                <Label className="text-xs text-gray-500">Auto-stop timer</Label>
                <Switch checked={autoStopEnabled} onCheckedChange={setAutoStopEnabled} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

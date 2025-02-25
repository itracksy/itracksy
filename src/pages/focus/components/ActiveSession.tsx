import { useToast } from "@/hooks/use-toast";
import { useUpdateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { TimeEntryWithRelations } from "@/types/projects";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Cloud } from "lucide-react";
import { useEffect, useState } from "react";

export const ActiveSession: React.FC<{ activeTimeEntry: TimeEntryWithRelations }> = ({
  activeTimeEntry,
}) => {
  const navigate = useNavigate();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const { toast } = useToast();
  const [duration, setDuration] = useState<string>("00:00");
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry) {
      const updateTimer = () => {
        const now = new Date();
        const startTimeDate = new Date(activeTimeEntry.startTime);
        const minutes = activeTimeEntry.targetDuration ?? 0;
        const diff = minutes * 60 - Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);

        // Format time differently for negative values
        if (diff <= 0) {
          const absDiff = Math.abs(diff);
          const mins = Math.floor(absDiff / 60);
          const secs = absDiff % 60;
          setDuration(`-${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);

          // Only stop if autoStopEnabled is true
          if (diff < 0 && activeTimeEntry.autoStopEnabled) {
            queryClient.invalidateQueries({ queryKey: ["timeEntries", "active"] });
            return;
          }
        } else {
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          setDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
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

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        <button
          onClick={handleStopTimeEntry}
          className="w-full rounded-lg bg-red-400 py-3 font-medium text-white shadow-sm transition hover:bg-red-500"
        >
          STOP {activeTimeEntry.isFocusMode ? "FOCUS" : "BREAK"}
        </button>

        {/* Extend Time Button */}
        <button
          onClick={handleExtendTime}
          className="w-full rounded-lg border border-gray-200 bg-white py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          +5 MINUTES
        </button>
      </div>

      {/* Raining Letters Button */}
      {!activeTimeEntry.isFocusMode && (
        <button
          onClick={() => navigate({ to: "/raining-letters" })}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-4 font-medium text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-200/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Cloud className="h-6 w-6 animate-bounce transition-transform duration-300 group-hover:scale-110" />
          <span className="relative z-10 bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-lg font-bold text-transparent">
            Take a Magical Break
          </span>
          <div className="absolute -inset-1 -z-10 animate-pulse opacity-25 blur">
            <div className="h-full w-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" />
          </div>
        </button>
      )}
    </>
  );
};

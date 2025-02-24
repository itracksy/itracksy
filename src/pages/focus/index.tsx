import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { breakEndTimeAtom } from "@/context/board";

export default function FocusPage() {
  const [breakEndTime, setBreakEndTime] = useAtom(breakEndTimeAtom);
  const { toast } = useToast();
  const [focusMinutes, setFocusMinutes] = React.useState(25); // Default Pomodoro time
  const [isRunning, setIsRunning] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(focusMinutes * 60);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      toast({
        title: "Focus session completed! 🎉",
        description: "Time for a well-deserved break.",
      });
      setBreakEndTime(5); // Default 5-minute break
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, toast, setBreakEndTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(focusMinutes * 60);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <Timer className="h-16 w-16 text-orange-600" />
        <h1 className="text-4xl font-bold">Focus Session</h1>
        <div className="font-mono text-6xl">{formatTime(timeLeft)}</div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="number"
          min="1"
          max="120"
          value={focusMinutes}
          onChange={(e) => {
            const value = Math.min(120, Math.max(1, parseInt(e.target.value) || 25));
            setFocusMinutes(value);
            if (!isRunning) {
              setTimeLeft(value * 60);
            }
          }}
          className="w-20 rounded-md border border-input/20 bg-transparent px-2 py-1 text-center text-lg focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
          placeholder="min"
        />
        <span className="text-lg text-muted-foreground">minutes</span>
      </div>

      <div className="flex gap-4">
        <Button
          size="lg"
          variant={isRunning ? "destructive" : "default"}
          onClick={handleStartStop}
          className={
            isRunning ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
          }
        >
          {isRunning ? "Stop" : "Start"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReset}
          className="border-orange-600 text-orange-600 hover:bg-orange-50"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

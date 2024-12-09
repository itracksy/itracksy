import { useState } from "react";
import { Play, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TrackingControls() {
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  const handleStartTracking = async () => {
    try {
      const started = await window.electronWindow.startTracking();
      console.log("TrackingControls: started", started);
      if (started) {
        setIsTracking(true);
        toast({
          title: "Tracking Started",
          description: "Window activity tracking has been started.",
        });
      }
    } catch (error) {
      console.error("TrackingControls: Error starting tracking", error);
      toast({
        title: "Error",
        description: "Failed to start tracking.",
        variant: "destructive",
      });
    }
  };

  const handleStopTracking = async () => {
    try {
      const stopped = await window.electronWindow.stopTracking();
      console.log("TrackingControls: stopped", stopped);
      if (stopped) {
        setIsTracking(false);
        toast({
          title: "Tracking Stopped",
          description: "Window activity tracking has been stopped.",
        });
      }
    } catch (error) {
      console.error("TrackingControls: Error stopping tracking", error);
      toast({
        title: "Error",
        description: "Failed to stop tracking.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isTracking ? (
        <Button onClick={handleStartTracking} variant="default" className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Start Tracking
        </Button>
      ) : (
        <Button
          onClick={handleStopTracking}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <StopCircle className="h-4 w-4" />
          Stop Tracking
        </Button>
      )}
    </div>
  );
}

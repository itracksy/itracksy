import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

import { PlayCircle, StopCircle } from "lucide-react";

export function TrackingControls() {
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial tracking state
    const getTrackingState = async () => {
      try {
        const state = await window.electronWindow.getTrackingState();
        setIsTracking(state);
      } catch (error) {
        console.error("TrackingControls: Error getting tracking state:", error);
      }
    };
    getTrackingState();
  }, []);

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
    <div className="flex flex-col items-center gap-2">
      {!isTracking ? (
        <SidebarMenuButton
          onClick={handleStartTracking}
          tooltip="Activity tracking is paused"
          className="hover:text-green-600"
        >
          <PlayCircle className="text-green-600" size={32} />
          <span className="text-muted-foreground">Activity tracking is paused</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          onClick={handleStopTracking}
          tooltip="Activity tracking is active"
          className="hover:text-red-600"
        >
          <StopCircle className="text-red-600" size={32} />
          <span className="text-green-600">Activity tracking is active</span>
        </SidebarMenuButton>
      )}
    </div>
  );
}

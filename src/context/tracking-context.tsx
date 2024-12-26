import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface TrackingContextType {
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getTrackingState = async () => {
      try {
        const state = await window.electronWindow.getTrackingState();
        setIsTracking(state);
      } catch (error) {
        console.error("TrackingProvider: Error getting tracking state:", error);
      }
    };
    getTrackingState();
  }, []);

  const startTracking = async () => {
    try {
      const started = await window.electronWindow.startTracking();
      if (started) {
        setIsTracking(true);
        toast({
          title: "Tracking Started",
          description: "Window activity tracking has been started.",
        });
      }
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const stopTracking = async () => {
    try {
      const stopped = await window.electronWindow.stopTracking();
      if (stopped) {
        setIsTracking(false);
        toast({
          title: "Tracking Stopped",
          description: "Window activity tracking has been stopped.",
        });
      }
    } catch (error) {
      console.error("TrackingProvider: Error stopping tracking", error);
      toast({
        title: "Error",
        description: "Failed to stop tracking.",
        variant: "destructive",
      });
    }
  };

  return (
    <TrackingContext.Provider value={{ isTracking, startTracking, stopTracking }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
}

import { useCallback } from "react";

import { useToast } from "./use-toast";

import { trpcClient } from "@/utils/trpc";
export const useTracking = () => {
  const { toast } = useToast();
  const startTracking = useCallback(async () => {
    try {
      trpcClient.activity.startTracking.mutate();

      toast({
        title: "Tracking Started",
        description: "Window activity tracking has been started.",
      });
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  }, []);

  const stopTracking = useCallback(() => {
    // Clear existing interval
    // Update tracking state
    trpcClient.activity.stopTracking.mutate();
  }, []);

  return {
    startTracking,
    stopTracking,
  };
};

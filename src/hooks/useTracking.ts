import { useCallback } from "react";

import { useToast } from "./use-toast";

import { trpcClient } from "@/utils/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useTracking = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["user.getActivitySettings"],
    queryFn: async () => {
      const data = await trpcClient.user.getActivitySettings.query();
      return data;
    },
  });

  const startTracking = useCallback(async () => {
    try {
      await trpcClient.activity.startTracking.mutate();
      // update querykey
      queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
      toast({
        title: "Tracking Started",
        description: "Window activity tracking has been started.",
      });
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    // Clear existing interval
    // Update tracking state
    await trpcClient.activity.stopTracking.mutate();
    // update querykey
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
    toast({
      title: "Tracking Stopped",
      description: "Window activity tracking has been stopped.",
    });
  }, []);

  return {
    startTracking,
    stopTracking,
    isTracking: data?.isTracking ?? false,
  };
};

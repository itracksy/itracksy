import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  accessibilityPermissionAtom,
  isTrackingAtom,
  screenRecordingPermissionAtom,
} from "@/context/activity";
import { useToast } from "./use-toast";
import { logger } from "@/services/logger";

export const useTracking = () => {
  const [isTracking, setIsTracking] = useAtom(isTrackingAtom);

  const accessibilityPermission = useAtomValue(accessibilityPermissionAtom);
  const screenRecordingPermission = useAtomValue(screenRecordingPermissionAtom);

  const { toast } = useToast();
  const startTracking = useCallback(async () => {
    try {
      window.electronWindow.startTracking({
        accessibilityPermission,
        screenRecordingPermission,
      });
      console.log("TrackingProvider: Tracking started)", {
        accessibilityPermission,
        screenRecordingPermission,
      });

      toast({
        title: "Tracking Started",
        description: "Window activity tracking has been started.",
      });
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  }, [accessibilityPermission, screenRecordingPermission]);

  const stopTracking = useCallback(() => {
    // Clear existing interval

    // Update tracking state
    setIsTracking(false);
  }, [setIsTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
};

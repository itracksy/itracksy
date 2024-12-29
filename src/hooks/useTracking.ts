import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  accessibilityPermissionAtom,
  isTrackingAtom,
  screenRecordingPermissionAtom,
} from "@/context/activity";
import { useToast } from "./use-toast";
import { ActivityRecord } from "@/types/activity";
const mergeActivityRecord = (prev: ActivityRecord[], started: ActivityRecord): ActivityRecord[] => {
  if (prev.length === 0) {
    return [{ ...started }];
  }

  // Helper function to check if records match
  const recordsMatch = (a: ActivityRecord, b: ActivityRecord): boolean => {
    return (
      a.id === b.id &&
      a.title === b.title &&
      a.ownerBundleId === b.ownerBundleId &&
      a.ownerProcessId === b.ownerProcessId &&
      a.ownerName === b.ownerName &&
      a.ownerPath === b.ownerPath &&
      a.platform === b.platform
    );
  };

  // Search backwards through the array

  for (let i = prev.length - 1; i >= 0; i--) {
    // Check if timestamps are more than 15 minutes apart
    if (started.timestamp - prev[i].timestamp > 15 * 60 * 1000) {
      break;
    }
    if (recordsMatch(prev[i], started)) {
      // Found a match - update count in place
      const result = [...prev];
      result[i] = {
        ...prev[i],
        count: (prev[i].count || 1) + 1,
      };
      return result;
    }
  }

  // No match found - add new record
  return [...prev, { ...started }];
};

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

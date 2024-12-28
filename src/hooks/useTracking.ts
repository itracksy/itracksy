import { useCallback, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  accessibilityPermissionAtom,
  activityWindowAtom,
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
      a.owner.bundleId === b.owner.bundleId &&
      a.owner.processId === b.owner.processId &&
      a.owner.name === b.owner.name &&
      a.owner.path === b.owner.path &&
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
  const intervalDuration = 3000;
  const [isTracking, setIsTracking] = useAtom(isTrackingAtom);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accessibilityPermission = useAtomValue(accessibilityPermissionAtom);
  const screenRecordingPermission = useAtomValue(screenRecordingPermissionAtom);
  const [_, setActivityWindow] = useAtom(activityWindowAtom);
  const { toast } = useToast();
  const onTick = useCallback(async () => {
    try {
      const started = await window.electronWindow.startTracking({
        accessibilityPermission,
        screenRecordingPermission,
      });
      console.log("TrackingProvider: Tracking started)", {
        accessibilityPermission,
        screenRecordingPermission,
      });
      console.log("started", started);
      setActivityWindow((prev) => mergeActivityRecord(prev, started));
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  }, [accessibilityPermission, screenRecordingPermission]);

  const startTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      onTick();
    }, intervalDuration);

    setIsTracking(true);
    toast({
      title: "Tracking Started",
      description: "Window activity tracking has been started.",
    });
  };

  const stopTracking = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update tracking state
    setIsTracking(false);
  }, [setIsTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
};

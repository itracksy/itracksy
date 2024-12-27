import { useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  accessibilityPermissionAtom,
  activityWindowAtom,
  isTrackingAtom,
  screenRecordingPermissionAtom,
} from "@/context/activity";
import { useToast } from "./use-toast";

export const useTracking = () => {
  const intervalDuration = 3000;
  const [isTracking, setIsTracking] = useAtom(isTrackingAtom);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accessibilityPermission = useAtomValue(accessibilityPermissionAtom);
  const screenRecordingPermission = useAtomValue(screenRecordingPermissionAtom);
  const [_, setActivityWindow] = useAtom(activityWindowAtom);
  const { toast } = useToast();
  const onTick = async () => {
    try {
      const started = await window.electronWindow.startTracking({
        accessibilityPermission,
        screenRecordingPermission,
      });
      setActivityWindow((prev) => [...prev, started]);
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  };

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

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    toast({
      title: "Tracking Stopped",
      description: "Window activity tracking has been stopped.",
    });
  };

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
};

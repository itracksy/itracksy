import { useRef } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  accessibilityPermissionAtom,
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
  const { toast } = useToast();
  const onTick = async () => {
    try {
      const started = await window.electronWindow.startTracking({
        accessibilityPermission,
        screenRecordingPermission,
      });
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

  const startTracking = () => {
    setIsTracking(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      onTick();
    }, intervalDuration);
  };

  const stopTracking = () => {
    setIsTracking(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
};

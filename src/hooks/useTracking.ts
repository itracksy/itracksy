import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  accessibilityPermissionAtom,
  isTrackingAtom,
  screenRecordingPermissionAtom,
  blockedDomainsAtom,
  blockedAppsAtom,
} from "@/context/activity";
import { useToast } from "./use-toast";

export const useTracking = () => {
  const [isTracking, setIsTracking] = useAtom(isTrackingAtom);
  const blockedDomains = useAtomValue(blockedDomainsAtom);
  const blockedApps = useAtomValue(blockedAppsAtom);
  const accessibilityPermission = useAtomValue(accessibilityPermissionAtom);
  const screenRecordingPermission = useAtomValue(screenRecordingPermissionAtom);

  const { toast } = useToast();
  const startTracking = useCallback(async () => {
    try {
      window.electronWindow.startTracking({
        accessibilityPermission,
        screenRecordingPermission,
        blockedDomains,
        blockedApps,
      });

      setIsTracking(true);

      toast({
        title: "Tracking Started",
        description: "Window activity tracking has been started.",
      });
    } catch (error) {
      console.error("TrackingProvider: Error starting tracking", error);
    }
  }, [accessibilityPermission, screenRecordingPermission, blockedDomains, blockedApps]);

  const stopTracking = useCallback(() => {
    // Clear existing interval
    // Update tracking state
    // setIsTracking(false);
  }, [setIsTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
  };
};

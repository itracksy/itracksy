import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "./use-toast";

export function useOfflineIndicator() {
  useEffect(() => {
    return onlineManager.subscribe(() => {
      if (onlineManager.isOnline()) {
        toast({
          title: "Online",
          duration: 2000,
        });
      } else {
        toast({
          title: "Offline",
          duration: Infinity,
        });
      }
    });
  }, []);
}

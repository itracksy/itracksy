import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

export interface VersionInfo {
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  downloadUrl?: string;
}

interface VersionCheckerProps {
  autoCheck?: boolean;
  showCheckButton?: boolean;
  onVersionInfo?: (info: VersionInfo) => void;
  cacheDuration?: number; // Duration in milliseconds to cache version info
}

export function VersionChecker({
  autoCheck = true,
  showCheckButton = false,
  onVersionInfo,
  cacheDuration = 24 * 60 * 60 * 1000, // Default: 24 hours
}: VersionCheckerProps) {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const { toast } = useToast();
  const [currentVersion, setCurrentVersion] = useState("");

  // Get current app version
  useEffect(() => {
    const fetchAppVersion = async () => {
      try {
        const version = await window.electronWindow.getAppVersion();
        setCurrentVersion(version);
      } catch (error) {
        console.error("Failed to get app version:", error);
      }
    };

    fetchAppVersion();
  }, []);

  // Use React Query for version checking with built-in caching
  const {
    data: versionInfo,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["appVersion", currentVersion],
    queryFn: async (): Promise<VersionInfo> => {
      try {
        const result = await window.electronWindow.checkForUpdates();
        return {
          currentVersion: result.currentVersion || currentVersion,
          latestVersion: result.latestVersion,
          hasUpdate: result.hasUpdate,
          downloadUrl: result.downloadUrl,
        };
      } catch (error) {
        console.error("Failed to check for updates:", error);
        return {
          currentVersion,
          hasUpdate: false,
        };
      }
    },
    enabled: autoCheck && !!currentVersion, // Only run if autoCheck is true and we have the current version
    staleTime: cacheDuration, // Consider data fresh for the cacheDuration
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch when reconnecting
  });

  // Notify parent component when version info is available
  useEffect(() => {
    if (versionInfo && onVersionInfo) {
      onVersionInfo(versionInfo);
    }
  }, [versionInfo, onVersionInfo]);

  // Handle opening download URL in browser
  const handleOpenDownloadLink = async () => {
    try {
      await trpcClient.utils.openExternalUrl.mutate({ url: "https://itracksy.com/download" });
    } catch (error) {
      console.error("Failed to open download URL:", error);
    }
  };

  // Show toast when update is available
  useEffect(() => {
    if (versionInfo?.hasUpdate) {
      toast({
        title: "Update Available",
        description: `Version ${versionInfo.latestVersion} is available. You are currently using version ${versionInfo.currentVersion}.`,
        variant: "default",
        duration: 10000, // Show for 10 seconds
        action: (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (versionInfo.downloadUrl) {
                  window.location.href = versionInfo.downloadUrl;
                }
              }}
              className="flex items-center"
            >
              <DownloadIcon className="h-2 w-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (versionInfo.downloadUrl) {
                  handleOpenDownloadLink();
                }
              }}
              className="flex items-center"
            >
              <ExternalLinkIcon className="h-2 w-2" />
              Open
            </Button>
          </div>
        ),
      });
    }
  }, [
    versionInfo?.hasUpdate,
    versionInfo?.latestVersion,
    versionInfo?.currentVersion,
    versionInfo?.downloadUrl,
    toast,
  ]);

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await refetch();

      if (!result.data?.hasUpdate) {
        // Only show "no updates" toast when manually checking
        toast({
          title: "No Updates Available",
          description: "You are using the latest version.",
          variant: "default",
          duration: 3000,
        });
      }

      return result.data;
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return { status: "error", message: "Failed to check for updates", hasUpdate: false };
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  if (!showCheckButton) {
    return null;
  }

  return (
    <Button variant="outline" onClick={checkForUpdates} disabled={isCheckingUpdate || isLoading}>
      <RefreshCwIcon
        className={`mr-2 h-4 w-4 ${isCheckingUpdate || isLoading ? "animate-spin" : ""}`}
      />
      {isCheckingUpdate || isLoading ? "Checking..." : "Check for Updates"}
    </Button>
  );
}

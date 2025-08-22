import { useEffect, useState, useRef, useCallback } from "react";
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

// Separate component for download buttons to manage download state independently
interface DownloadButtonsProps {
  downloadUrl: string;
  onOpenDownloadLink: () => void;
}

function DownloadButtons({ downloadUrl, onOpenDownloadLink }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { toast } = useToast();

  const handleDownloadUpdate = useCallback(async () => {
    if (!downloadUrl) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await trpcClient.utils.downloadUpdate.mutate({
        downloadUrl,
      });

      if (result.status === "success") {
        setDownloadProgress(100);
        toast({
          title: "Download Complete",
          description: "The update has been downloaded and opened automatically.",
          variant: "default",
          duration: 5000,
        });
      } else {
        toast({
          title: "Download Failed",
          description: result.message || "Failed to download update",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to download update:", error);
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading the update",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [downloadUrl, toast]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadUpdate}
        disabled={isDownloading}
        className="flex items-center"
      >
        <DownloadIcon className="h-2 w-2" />
        {isDownloading ? `${downloadProgress}%` : "Download"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenDownloadLink}
        className="flex items-center"
      >
        <ExternalLinkIcon className="h-2 w-2" />
        Open
      </Button>
    </div>
  );
}

export function VersionChecker({
  autoCheck = true,
  showCheckButton = false,
  onVersionInfo,
  cacheDuration = 24 * 60 * 60 * 1000, // Default: 24 hours
}: VersionCheckerProps) {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const { toast } = useToast();
  const updateToastShown = useRef(false);

  // Get current app version using tRPC
  const { data: currentVersion } = useQuery({
    queryKey: ["appVersion"],
    queryFn: () => trpcClient.utils.getAppVersion.query(),
    staleTime: Infinity, // Version doesn't change during runtime
  });

  // Use React Query for version checking with built-in caching
  const {
    data: updateCheckResult,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["appVersionCheck", currentVersion],
    queryFn: () => trpcClient.utils.checkForUpdates.query(),
    enabled: autoCheck && !!currentVersion, // Only run if autoCheck is true and we have the current version
    staleTime: cacheDuration, // Consider data fresh for the cacheDuration
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch when reconnecting
  });

  // Transform the tRPC result to match VersionInfo interface
  const versionInfo: VersionInfo | undefined = updateCheckResult
    ? {
        currentVersion: updateCheckResult.status === "success" ? updateCheckResult.currentVersion : currentVersion || "",
        latestVersion: updateCheckResult.status === "success" ? updateCheckResult.latestVersion : undefined,
        hasUpdate: updateCheckResult.hasUpdate,
        downloadUrl: updateCheckResult.status === "success" ? updateCheckResult.downloadUrl : undefined,
      }
    : undefined;

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

  // Show toast when update is available (only once)
  useEffect(() => {
    if (versionInfo?.hasUpdate && !updateToastShown.current) {
      updateToastShown.current = true;
      
      toast({
        title: "Update Available",
        description: `Version ${versionInfo.latestVersion} is available. You are currently using version ${versionInfo.currentVersion}.`,
        variant: "default",
        duration: 10000, // Show for 10 seconds
        action: (
          <DownloadButtons
            downloadUrl={versionInfo.downloadUrl!}
            onOpenDownloadLink={handleOpenDownloadLink}
          />
        ),
      });
    }
    
    // Reset the flag when no update is available
    if (!versionInfo?.hasUpdate) {
      updateToastShown.current = false;
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

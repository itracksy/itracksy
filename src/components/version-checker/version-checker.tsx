import { useEffect, useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExternalLinkIcon, RefreshCwIcon, PackageIcon } from "lucide-react";
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
  latestVersion?: string;
  onOpenDownloadLink: () => void;
}

function DownloadButtons({ downloadUrl, latestVersion, onOpenDownloadLink }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [autoDownloadComplete, setAutoDownloadComplete] = useState(false);
  const autoDownloadAttempted = useRef(false);
  const { toast } = useToast();
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset auto-download attempt when version changes
  useEffect(() => {
    autoDownloadAttempted.current = false;
  }, [latestVersion]);

  // Check for existing downloaded file using tRPC
  const { data: existingUpdate } = useQuery({
    queryKey: ["checkExistingUpdate", latestVersion],
    queryFn: () => trpcClient.utils.checkExistingUpdate.query({ version: latestVersion! }),
    enabled: !!latestVersion && !downloadedFilePath,
  });

  // Update state when existing file is found
  useEffect(() => {
    if (existingUpdate?.exists && existingUpdate.filePath) {
      console.log("Found existing download for version:", latestVersion);
      setDownloadedFilePath(existingUpdate.filePath);
      setAutoDownloadComplete(true);
    }
  }, [existingUpdate, latestVersion]);

  // Auto-download when a new version is available (only once per version)
  useEffect(() => {
    // Only auto-download if we haven't attempted it yet for this version
    if (downloadUrl && latestVersion && !autoDownloadAttempted.current) {
      console.log("Auto-downloading latest version:", latestVersion);
      autoDownloadAttempted.current = true;

      // Use setTimeout to avoid render loop
      const timeoutId = setTimeout(async () => {
        try {
          setIsDownloading(true);
          setDownloadProgress(0);

          const result = await trpcClient.utils.downloadUpdate.mutate({
            downloadUrl,
          });

          if (result.status === "success" && result.filePath) {
            setDownloadedFilePath(result.filePath);
            setAutoDownloadComplete(true);
            toast({
              title: "Auto-download Complete",
              description: `Update ${latestVersion} downloaded automatically. Click "Install Update" to install.`,
            });
          }
        } catch (error) {
          console.error("Auto-download failed:", error);
          toast({
            title: "Auto-download Failed",
            description: "Failed to download update automatically. You can download manually.",
            variant: "destructive",
          });
        } finally {
          setIsDownloading(false);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [downloadUrl, latestVersion, toast]); // Only essential dependencies

  const startProgressTimer = useCallback(() => {
    // Clear any existing timer
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    // Start a timer that gradually increases progress to 90%
    // This prevents users from thinking the download is stuck
    progressTimerRef.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          return prev; // Don't go beyond 90% until actual completion
        }
        const increment = Math.round(Math.random() * 10 + 5); // Random increment between 5-15%
        return Math.min(prev + increment, 90); // Ensure we don't exceed 90%
      });
    }, 1000); // Update every second
  }, []);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopProgressTimer();
    };
  }, [stopProgressTimer]);

  const handleDownloadUpdate = useCallback(async () => {
    if (!downloadUrl) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    startProgressTimer();

    try {
      const result = await trpcClient.utils.downloadUpdate.mutate({
        downloadUrl,
      });

      // Stop the progress timer and set to 100% on completion
      stopProgressTimer();
      setDownloadProgress(100);

      if (result.status === "success") {
        setDownloadedFilePath(result.filePath || null);
        setAutoDownloadComplete(true);
        toast({
          title: "Download Complete",
          description: `The update ZIP file has been downloaded. Click "Install Update" to automatically install the update.`,
          variant: "default",
          duration: 2 * 60 * 1000, // 2 minutes
          action: (
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleInstallUpdate}
                disabled={isInstalling}
                className="flex items-center gap-2"
              >
                <PackageIcon className="h-4 w-4" />
                {isInstalling ? "Installing..." : "Install Update"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (result.filePath) {
                    const folderPath = result.filePath.substring(
                      0,
                      result.filePath.lastIndexOf("/")
                    );
                    trpcClient.utils.openFolder.mutate({ folderPath });
                  }
                }}
              >
                Open Folder
              </Button>
            </div>
          ),
        });
      } else {
        toast({
          title: "Download Failed",
          description: result.message || "Failed to download update",
          variant: "destructive",
          duration: 10000,
          action: (
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                try {
                  await trpcClient.utils.openExternalUrl.mutate({ url: downloadUrl });
                } catch (err) {
                  console.error("Failed to open download URL:", err);
                }
              }}
            >
              Open in Browser
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error("Failed to download update:", error);
      stopProgressTimer();
      toast({
        title: "Download Failed",
        description:
          String((error as any)?.message) || "An error occurred while downloading the update",
        variant: "destructive",
        duration: 10000,
        action: (
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              try {
                await trpcClient.utils.openExternalUrl.mutate({ url: downloadUrl });
              } catch (err) {
                console.error("Failed to open download URL:", err);
              }
            }}
          >
            Open in Browser
          </Button>
        ),
      });
    } finally {
      setIsDownloading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    }
  }, [downloadUrl, toast, startProgressTimer, stopProgressTimer]);

  const handleInstallUpdate = useCallback(async () => {
    if (!downloadedFilePath || !latestVersion) {
      console.error("Install update failed: missing file path or version", {
        downloadedFilePath,
        latestVersion,
      });
      return;
    }

    console.log("Starting update installation...", {
      zipFilePath: downloadedFilePath,
      version: latestVersion,
    });
    setIsInstalling(true);

    try {
      const result = await trpcClient.utils.installUpdate.mutate({
        zipFilePath: downloadedFilePath,
        version: latestVersion,
      });

      console.log("Install update result:", result);

      if (result && result.status === "success") {
        console.log("Update installation successful!");
        toast({
          title: "Update Installed Successfully",
          description: result.message,
          variant: "default",
          duration: 10000,
          action: (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                trpcClient.utils.quitApp.mutate();
              }}
            >
              Restart App
            </Button>
          ),
        });
      } else if (result) {
        console.error("Update installation failed:", result);

        // Check if we have fallback options
        if (result.fallbackUrl) {
          toast({
            title: "Auto-Update Failed",
            description: result.message,
            variant: "destructive",
            duration: 15000,
            action: (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(result.fallbackUrl, "_blank");
                  }}
                >
                  <ExternalLinkIcon className="mr-1 h-4 w-4" />
                  Download Manually
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    window.open("https://www.itracksy.com/download", "_blank");
                  }}
                >
                  <ExternalLinkIcon className="mr-1 h-4 w-4" />
                  View Releases
                </Button>
              </div>
            ),
          });
        } else {
          toast({
            title: "Installation Failed",
            description: result.message,
            variant: "destructive",
            duration: 10000,
          });
        }
      }
    } catch (error) {
      console.error("Failed to install update:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        zipFilePath: downloadedFilePath,
        version: latestVersion,
      });

      // Show fallback options when installation fails
      toast({
        title: "Auto-Update Failed",
        description: "An error occurred while installing the update. You can download it manually.",
        variant: "destructive",
        duration: 15000,
        action: (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(downloadUrl, "_blank");
              }}
            >
              <ExternalLinkIcon className="mr-1 h-4 w-4" />
              Download Manually
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                window.open(
                  `https://github.com/itracksy/itracksy/releases/tag/v${latestVersion}`,
                  "_blank"
                );
              }}
            >
              <ExternalLinkIcon className="mr-1 h-4 w-4" />
              View Releases
            </Button>
          </div>
        ),
      });
    } finally {
      console.log("Install update process completed, setting isInstalling to false");
      setIsInstalling(false);
    }
  }, [downloadedFilePath, latestVersion, toast, downloadUrl]);

  return (
    <div className="flex flex-col gap-2">
      {isDownloading && autoDownloadComplete === false && (
        <div className="text-xs text-muted-foreground">
          Auto-downloading update in background...
        </div>
      )}
      {downloadedFilePath && autoDownloadComplete && (
        <div className="text-xs text-green-600">Update ready to install!</div>
      )}
      {!downloadedFilePath ? (
        <>
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
        </>
      ) : (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={handleInstallUpdate}
            disabled={isInstalling}
            className="flex items-center"
          >
            <PackageIcon className="h-2 w-2" />
            {isInstalling ? "Installing..." : "Install Update"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadUpdate}
            disabled={isDownloading}
            className="flex items-center"
          >
            <DownloadIcon className="h-2 w-2" />
            {isDownloading ? `${downloadProgress}%` : "Re-download"}
          </Button>
        </>
      )}
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
        currentVersion:
          updateCheckResult.status === "success"
            ? updateCheckResult.currentVersion
            : currentVersion || "",
        latestVersion:
          updateCheckResult.status === "success" ? updateCheckResult.latestVersion : undefined,
        hasUpdate: updateCheckResult.hasUpdate,
        downloadUrl:
          updateCheckResult.status === "success" ? updateCheckResult.downloadUrl : undefined,
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
        duration: 2 * 60 * 1000, // 2 minutes
        action: (
          <DownloadButtons
            downloadUrl={versionInfo.downloadUrl!}
            latestVersion={versionInfo.latestVersion}
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

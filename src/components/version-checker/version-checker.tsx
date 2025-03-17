import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";

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
}

export function VersionChecker({ 
  autoCheck = true, 
  showCheckButton = false,
  onVersionInfo
}: VersionCheckerProps) {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    currentVersion: "",
    hasUpdate: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const appVersion = await window.electronWindow.getAppVersion();
        setVersionInfo(prev => ({ ...prev, currentVersion: appVersion }));
      } catch (error) {
        console.error("Failed to get app version:", error);
      }
    };

    fetchVersion();
    
    if (autoCheck) {
      // Add a small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoCheck]);

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await window.electronWindow.checkForUpdates();
      
      const newVersionInfo: VersionInfo = {
        currentVersion: result.currentVersion || versionInfo.currentVersion,
        latestVersion: result.latestVersion,
        hasUpdate: result.hasUpdate,
        downloadUrl: result.downloadUrl
      };
      
      setVersionInfo(newVersionInfo);
      
      if (onVersionInfo) {
        onVersionInfo(newVersionInfo);
      }
      
      if (result.hasUpdate) {
        toast({
          title: "Update Available",
          description: `Version ${result.latestVersion} is available. You are currently using version ${result.currentVersion}.`,
          variant: "default",
          duration: 10000, // Show for 10 seconds
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(result.downloadUrl, '_blank')}
              className="flex items-center"
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          ),
        });
      } else if (!autoCheck) {
        // Only show "no updates" toast when manually checking
        toast({
          title: "No Updates Available",
          description: "You are using the latest version.",
          variant: "default",
          duration: 3000,
        });
      }
      
      return result;
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
    <Button variant="outline" onClick={checkForUpdates} disabled={isCheckingUpdate}>
      <RefreshCwIcon
        className={`mr-2 h-4 w-4 ${isCheckingUpdate ? "animate-spin" : ""}`}
      />
      {isCheckingUpdate ? "Checking..." : "Check for Updates"}
    </Button>
  );
}

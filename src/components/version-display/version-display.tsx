import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { VersionInfo } from "@/components/version-checker";
import { useToast } from "@/hooks/use-toast";

interface VersionDisplayProps {
  showUpdateButton?: boolean;
  className?: string;
}

export function VersionDisplay({ showUpdateButton = true, className = "" }: VersionDisplayProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    currentVersion: "",
    hasUpdate: false
  });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
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
  }, []);

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await window.electronWindow.checkForUpdates();
      
      setVersionInfo({
        currentVersion: result.currentVersion || versionInfo.currentVersion,
        latestVersion: result.latestVersion,
        hasUpdate: result.hasUpdate,
        downloadUrl: result.downloadUrl
      });
      
      if (result.hasUpdate) {
        toast({
          title: "Update Available",
          description: `Version ${result.latestVersion} is available. You are currently using version ${result.currentVersion}.`,
          variant: "default",
          duration: 10000,
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
      } else {
        toast({
          title: "No Updates Available",
          description: "You are using the latest version.",
          variant: "default",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-muted-foreground">v{versionInfo.currentVersion}</span>
      {versionInfo.hasUpdate && (
        <span className="text-yellow-500 animate-pulse">Update Available</span>
      )}
      {showUpdateButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkForUpdates} 
          disabled={isCheckingUpdate}
          className="h-6 px-2"
        >
          <RefreshCwIcon
            className={`h-3 w-3 ${isCheckingUpdate ? "animate-spin" : ""}`}
          />
        </Button>
      )}
    </div>
  );
}

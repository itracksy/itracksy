import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

export function UpdateChecker() {
  const { toast } = useToast();

  useEffect(() => {
    // Check for updates when the component mounts
    const checkForUpdates = async () => {
      try {
        const result = await window.electronWindow.checkForUpdates();

        if (result.hasUpdate) {
          toast({
            title: "Update Available",
            description: `Version ${result.latestVersion} is available. You are currently using version ${result.currentVersion}.`,
            variant: "default",
            duration: 0, // Keep it visible until dismissed
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(result.downloadUrl, "_blank")}
                className="flex items-center"
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
            ),
          });
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast]);

  // This component doesn't render anything
  return null;
}

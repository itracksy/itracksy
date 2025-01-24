import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon, RefreshCwIcon, ScrollTextIcon } from "lucide-react";
import { logger } from "@/helpers/logger";

export function AboutSection() {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const version = window.electronWindow.getAppVersion();

  const handleCheckUpdate = async () => {
    try {
      setIsCheckingUpdate(true);
      await window.electronWindow.checkForUpdates();
    } catch (error) {
      logger.error("Failed to check for updates", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleOpenLogFile = async () => {};

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>About iTracksy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm">
            Version: <span className="font-mono">{version}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCheckUpdate} disabled={isCheckingUpdate}>
              <RefreshCwIcon className={`mr-2 h-4 w-4 ${isCheckingUpdate ? "animate-spin" : ""}`} />
              {isCheckingUpdate ? "Checking..." : "Check for Updates"}
            </Button>

            <Button variant="outline" onClick={handleOpenLogFile}>
              <ScrollTextIcon className="mr-2 h-4 w-4" />
              Open Log File
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Log file location:{" "}
            <button
              onClick={handleOpenLogFile}
              className="inline-flex items-center hover:underline"
            >
              <ExternalLinkIcon className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

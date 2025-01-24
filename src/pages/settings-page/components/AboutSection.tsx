import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon, RefreshCwIcon, ScrollTextIcon, Trash2Icon } from "lucide-react";

export function AboutSection() {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    const fetchVersion = async () => {
      const appVersion = await window.electronWindow.getAppVersion();
      setVersion(appVersion);
    };
    fetchVersion();
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      await window.electronWindow.checkForUpdates();
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleOpenLogFile = async () => {
    const content = await window.electronWindow.getLogFileContent();
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `itracksy-${timestamp}.log`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleClearActivities = async () => {
    await window.electronWindow.clearActivities();
  };
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
            <Button variant="outline" onClick={handleClearActivities}>
              <Trash2Icon className="mr-2 h-4 w-4" />
              Clear Activities
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

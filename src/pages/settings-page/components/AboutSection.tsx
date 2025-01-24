import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLinkIcon, RefreshCwIcon, ScrollTextIcon, Trash2Icon } from "lucide-react";

export function AboutSection() {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [version, setVersion] = useState<string>("");
  const [logContent, setLogContent] = useState<string>("");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

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
    try {
      const content = await window.electronWindow.getLogFileContent();
      setLogContent(content);
      setIsLogDialogOpen(true);
    } catch (error) {
      console.error("Failed to load log file:", error);
    }
  };

  const handleClearActivities = async () => {
    await window.electronWindow.clearActivities();
  };

  return (
    <>
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
                View Logs
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

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Application Logs</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono">{logContent}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

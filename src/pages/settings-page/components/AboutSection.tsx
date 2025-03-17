import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollTextIcon, Trash2Icon } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { VersionChecker, VersionInfo } from "@/components/version-checker";

export function AboutSection() {
  const [version, setVersion] = useState<string>("");
  const [logContent, setLogContent] = useState<string>("");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

  const handleVersionInfo = (info: VersionInfo) => {
    setVersion(info.currentVersion);
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
    await trpcClient.activity.clearActivities.mutate();
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
              <VersionChecker 
                autoCheck={false}
                showCheckButton={true}
                onVersionInfo={handleVersionInfo}
              />

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
        <DialogContent className="max-h-[90vh] w-full max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Application Logs</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[75vh] w-full rounded-md border p-4">
            <div className="w-full">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">{logContent}</pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

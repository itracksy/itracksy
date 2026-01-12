import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ScrollTextIcon, Copy, Check, Database } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { VersionChecker, VersionInfo } from "@/components/version-checker";

export function AboutSection() {
  const [version, setVersion] = useState<string>("");
  const [logContent, setLogContent] = useState<string>("");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [dbPath, setDbPath] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleVersionInfo = (info: VersionInfo) => {
    setVersion(info.currentVersion);
  };

  useEffect(() => {
    const loadDbPath = async () => {
      try {
        const result = await trpcClient.utils.getDatabasePath.query();
        setDbPath(result.path);
      } catch (error) {
        console.error("Failed to load database path:", error);
      }
    };
    loadDbPath();
  }, []);

  const handleCopyDbPath = async () => {
    try {
      await navigator.clipboard.writeText(dbPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy path:", error);
    }
  };

  const handleOpenLogFile = async () => {
    try {
      const result = await trpcClient.utils.getLogFileContent.query();
      setLogContent(result.content);
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

            {/* Database Path Section */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4" />
                Database Location
              </div>
              <div className="flex gap-2">
                <Input value={dbPath} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopyDbPath} title="Copy path">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this path to backup your data or access the database file directly.
              </p>
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  title: string;
  reports: {
    name: string;
    duration: number;
    percentage: number;
  }[];
  permissionDisabled?: boolean;
  onEnablePermission?: () => Promise<void>;
};

export default function TimeBreakdown({
  reports,
  title,
  permissionDisabled,
  onEnablePermission,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getTrackingState = async () => {
      try {
        const state = await window.electronWindow.getTrackingState();
        setIsTracking(state);
      } catch (error) {
        console.error("TimeBreakdown: Error getting tracking state:", error);
      }
    };
    getTrackingState();
  }, []);

  const handleStartTracking = async () => {
    try {
      const started = await window.electronWindow.startTracking();
      if (started) {
        setIsTracking(true);
        toast({
          title: "Tracking Started",
          description: "Window activity tracking has been started.",
        });
      }
    } catch (error) {
      console.error("TimeBreakdown: Error starting tracking", error);
      toast({
        title: "Error",
        description: "Failed to start tracking.",
        variant: "destructive",
      });
    }
  };

  const handleStopTracking = async () => {
    try {
      const stopped = await window.electronWindow.stopTracking();
      if (stopped) {
        setIsTracking(false);
        toast({
          title: "Tracking Stopped",
          description: "Window activity tracking has been stopped.",
        });
      }
    } catch (error) {
      console.error("TimeBreakdown: Error stopping tracking", error);
      toast({
        title: "Error",
        description: "Failed to stop tracking.",
        variant: "destructive",
      });
    }
  };

  const handleEnablePermission = async () => {
    if (!onEnablePermission) return;
    setIsLoading(true);
    try {
      await onEnablePermission();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {!permissionDisabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            className="h-8 w-8"
          >
            {isTracking ? <StopCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionDisabled ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {title === "Domain Usage"
                ? "Enable accessibility permission to track domain usage"
                : "Enable screen recording permission to track window titles"}
            </p>
            <Button onClick={handleEnablePermission} variant="outline" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable Permission"
              )}
            </Button>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.name} className="flex items-center justify-between space-x-2">
              <span className="flex-1 truncate text-sm font-medium">{report.name}</span>
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {Math.round(report.duration / 60)} min ({Math.round(report.percentage)}%)
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

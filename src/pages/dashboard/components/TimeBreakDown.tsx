import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  reports: {
    name: string;
    duration: number;
    percentage: number;
  }[];
  permissionDisabled?: boolean;
  onEnablePermission?: () => Promise<void>;
  className?: string;
};

export default function TimeBreakdown({
  reports,
  title,
  permissionDisabled,
  onEnablePermission,
  className,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { isTracking, startTracking, stopTracking } = useTracking();

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
    <Card className={cn("col-span-1", className, !isTracking && "opacity-90")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {!permissionDisabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTracking ? "destructive" : "default"}
                  size="icon"
                  onClick={isTracking ? stopTracking : startTracking}
                  className="h-6 w-6"
                >
                  {isTracking ? (
                    <StopCircle className="h-5 w-5" />
                  ) : (
                    <PlayCircle className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTracking ? "Stop Tracking" : "Start Tracking"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className={`space-y-4 ${!isTracking ? "opacity-50" : ""}`}>
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

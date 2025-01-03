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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-tracksy-blue text-lg font-medium dark:text-white">
          {title}
        </CardTitle>
        {!permissionDisabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTracking ? "destructive" : "default"}
                  size="icon"
                  onClick={isTracking ? stopTracking : startTracking}
                  className={cn(
                    "h-7 w-7",
                    isTracking
                      ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      : "bg-tracksy-gold hover:bg-tracksy-gold/90 dark:bg-tracksy-gold/80 dark:hover:bg-tracksy-gold/70 text-white"
                  )}
                >
                  {isTracking ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTracking ? "Stop Tracking" : "Start Tracking"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {permissionDisabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEnablePermission}
                  disabled={isLoading}
                  className="border-tracksy-gold/50 dark:border-tracksy-gold/30 hover:border-tracksy-gold dark:hover:border-tracksy-gold/60 hover:bg-tracksy-gold/10 dark:hover:bg-tracksy-gold/5 h-7 w-7"
                >
                  {isLoading ? (
                    <Loader2 className="text-tracksy-gold h-4 w-4 animate-spin dark:text-white/80" />
                  ) : (
                    <Lock className="text-tracksy-gold h-4 w-4 dark:text-white/80" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enable Permission</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.map((report) => (
          <div key={report.name} className="group flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <p className="text-tracksy-blue max-w-[250px] truncate font-medium leading-none dark:text-white">
                  {report.name}
                </p>
                <span className="text-right">
                  {Math.round(report.duration / 60) === 0
                    ? "--"
                    : `${Math.round(report.duration / 60)} min (${Math.round(report.percentage)}%)`}
                </span>
              </div>
              <div className="bg-tracksy-gold/10 dark:bg-tracksy-gold/5 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-tracksy-gold dark:bg-tracksy-gold/80 h-full rounded-full transition-all"
                  style={{ width: `${report.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

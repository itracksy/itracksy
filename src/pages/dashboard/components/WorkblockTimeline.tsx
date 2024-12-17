import { ApplicationDurationReport } from "@/types/activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkBlock {
  startTime: string;
  activity: string;
  duration: string;
  score?: number;
}

interface WorkblockTimelineProps {
  reports: ApplicationDurationReport[];
}

export function WorkblockTimeline({ reports }: WorkblockTimelineProps) {
  const getWorkblocks = (): WorkBlock[] => {
    return reports
      .flatMap((report) =>
        report.instances.map((instance) => ({
          startTime: new Date(instance.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          activity: report.applicationName,
          duration: formatDuration(instance.duration),
          score: Math.round(Math.random() * 10 + 85), // Placeholder for actual productivity score
        }))
      )
      .sort((a, b) => {
        const timeA = convertTimeToMinutes(a.startTime);
        const timeB = convertTimeToMinutes(b.startTime);
        return timeA - timeB;
      });
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.round(ms / (1000 * 60));
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}hr ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const workblocks = getWorkblocks();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workblocks.map((block, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16 text-sm text-muted-foreground">{block.startTime}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{block.activity}</span>
                  <span className="text-sm text-muted-foreground">{block.duration}</span>
                </div>
                {block.score && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${block.score}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

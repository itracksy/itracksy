import {
  ActivityRecord,
  ApplicationDurationReport,
  calculateApplicationDurations,
} from "@/types/activity";

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
    <div className="max-h-[400px] overflow-y-auto rounded-lg bg-gray-900 p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">WORKBLOCKS</h2>
      <div className="space-y-3">
        {workblocks.map((block, index) => (
          <div key={index} className="flex items-center text-white">
            <div className="w-16 text-sm">{block.startTime}</div>
            <div className="mr-3 w-4">
              <div className="h-full w-0.5 bg-cyan-400"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm">{block.activity}</div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{block.duration}</span>
                {block.score && <span>{block.score.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

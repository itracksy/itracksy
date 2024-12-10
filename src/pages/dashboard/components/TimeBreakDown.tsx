type Props = {
  title: string;
  reports: {
    name: string;
    duration: number;
    percentage: number;
  }[];
};

export default function TimeBreakdown({ reports, title }: Props) {
  return (
    <div className="w-full max-w-2xl space-y-6 rounded-lg bg-zinc-950 p-6 text-zinc-100">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-4">
        {reports.map((entry) => (
          <div key={entry.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="break-words text-sm text-zinc-400">{entry.name}</span>
              <span className="ml-4 text-sm text-zinc-500">{entry.duration}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="w-12 text-right text-sm">{Math.ceil(entry.percentage)}%</div>
              <div className="relative h-2 rounded bg-zinc-800">
                <div
                  className="absolute left-0 top-0 h-full rounded bg-indigo-500"
                  style={{ width: `${entry.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((entry) => (
          <div key={entry.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="break-words text-sm text-muted-foreground">{entry.name}</span>
              <span className="ml-4 text-sm text-muted-foreground">{entry.duration}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="w-12 text-right text-sm text-foreground">
                {Math.ceil(entry.percentage)}%
              </div>
              <div className="relative h-2 rounded bg-secondary">
                <div
                  className="absolute left-0 top-0 h-full rounded bg-primary"
                  style={{ width: `${entry.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

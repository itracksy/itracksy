import { Clock, CheckCircle, BarChart, Tag, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/lib/utils";

interface SummaryCardProps {
  totalFocusTime: number;
  totalSessions: number;
  productivityPercentage: number;
  classificationProgress: number;
}

export function SummaryCard({
  totalFocusTime,
  totalSessions,
  productivityPercentage,
  classificationProgress,
}: SummaryCardProps) {
  const progressPercent = Math.round(classificationProgress * 100);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Focus Time Card */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm dark:from-blue-950/50 dark:to-blue-900/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Focus Time</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatTime(totalFocusTime)}
          </p>
        </CardContent>
      </Card>

      {/* Sessions Card */}
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm dark:from-purple-950/50 dark:to-purple-900/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Sessions</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
            {totalSessions}
          </p>
        </CardContent>
      </Card>

      {/* Productivity Card */}
      <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-sm dark:from-green-950/50 dark:to-green-900/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Productive</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">
            {productivityPercentage}%
          </p>
        </CardContent>
      </Card>

      {/* Classification Progress Card */}
      <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm dark:from-amber-950/50 dark:to-amber-900/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Tag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Classified</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {progressPercent}%
          </p>
          <Progress
            value={progressPercent}
            className="mt-2 h-1.5 bg-amber-200/50 dark:bg-amber-800/30"
            indicatorClassName="bg-amber-500 dark:bg-amber-400"
          />
        </CardContent>
      </Card>
    </div>
  );
}

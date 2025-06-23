import { SummaryCard } from "./components/summary-card";
import { SessionList } from "./components/session-list";

import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useAtomValue } from "jotai";
import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export function ActivityClassificationPage() {
  const { toast } = useToast();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["activityRules"],
    queryFn: () => trpcClient.activity.getUserRules.query(),
  });
  const selectedClassificationTimeRange = useAtomValue(selectedClassificationTimeRangeAtom);

  // Get productivity stats based on the selected time range
  const { data: productivityStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["productivityStats", selectedClassificationTimeRange],
    queryFn: () =>
      trpcClient.activity.getProductivityStats.query({
        startTime: selectedClassificationTimeRange.start,
        endTime: selectedClassificationTimeRange.end,
      }),
    enabled: !!selectedClassificationTimeRange,
  });

  // Calculate summary statistics
  const totalFocusTime = productivityStats?.totalDuration || 0;
  const totalSessions = productivityStats?.focusSessionCount || 0;

  const classifiedActivities = productivityStats?.ratedActivityCount || 0;
  const totalActivities = productivityStats?.activityCount || 0;

  const productiveTime = productivityStats?.productiveDuration || 0;

  const productivityPercentage = Math.round(
    (productiveTime / (productivityStats?.totalDuration || 1)) * 100
  );
  // Create a new rule

  // Delete a rule
  const deleteRule = (ruleId: string) => {};

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!rules) {
    return <div>Failed to load rules</div>;
  }
  const classificationProgress = totalActivities > 0 ? classifiedActivities / totalActivities : 0;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Activity Classification
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Classify your activities to improve productivity insights
          </p>
        </div>
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link to="/rule-book">
            <BookOpen className="h-4 w-4" />
            Rule Book
          </Link>
        </Button>
      </div>

      <SummaryCard
        totalFocusTime={totalFocusTime}
        totalSessions={totalSessions}
        productivityPercentage={productivityPercentage}
        classificationProgress={classificationProgress}
      />

      <SessionList />
      <div className="h-20" />
    </div>
  );
}

import { SummaryCard } from "./components/summary-card";
import { SessionList } from "./components/session-list";

import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useAtomValue } from "jotai";
import { selectedAchievementTimeRangeAtom } from "@/context/timeRange";

export function FocusSessionsAchievement() {
  const { toast } = useToast();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["activityRules"],
    queryFn: () => trpcClient.activity.getUserRules.query(),
  });
  const selectedAchievementTimeRange = useAtomValue(selectedAchievementTimeRangeAtom);

  // Get productivity stats based on the selected time range
  const { data: productivityStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["productivityStats", selectedAchievementTimeRange],
    queryFn: () =>
      trpcClient.activity.getProductivityStats.query({
        startTime: selectedAchievementTimeRange.start,
        endTime: selectedAchievementTimeRange.end,
      }),
    enabled: !!selectedAchievementTimeRange,
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Focus Sessions Achievement
        </h1>
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

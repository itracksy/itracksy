import { SummaryCard } from "./components/summary-card";
import { SessionList } from "./components/session-list";
import { QuickClassify } from "./components/quick-classify";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useAtomValue } from "jotai";
import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen, Tag } from "lucide-react";

export function ActivityClassificationPage() {
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Failed to load rules</p>
      </div>
    );
  }

  const classificationProgress = totalActivities > 0 ? classifiedActivities / totalActivities : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-lg">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Activity Classification
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Classify apps and websites to track your productivity
              </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link
            to="/rule-book"
            search={{
              editRuleId: undefined,
              createRule: false,
              appName: undefined,
              domain: undefined,
              title: undefined,
              titleCondition: undefined,
              rating: undefined,
            }}
          >
            <BookOpen className="h-4 w-4" />
            Rule Book
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCard
        totalFocusTime={totalFocusTime}
        totalSessions={totalSessions}
        productivityPercentage={productivityPercentage}
        classificationProgress={classificationProgress}
      />

      {/* Quick Classification */}
      <QuickClassify />

      {/* Session History */}
      <SessionList />

      <div className="h-16" />
    </div>
  );
}

import { useState } from "react";
import { SummaryCard } from "./components/summary-card";
import { SessionList } from "./components/session-list";
import { RulesPanel } from "./components/rules-panel";

import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "@/types/time";

export function FocusSessionsAchievement() {
  const { toast } = useToast();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["activityRules"],
    queryFn: () => trpcClient.activity.getUserRules.query(),
  });
  // Calculate summary statistics
  const totalFocusTime = 0;
  const totalSessions = 0;

  const classifiedActivities = 0;

  const totalActivities = 0;

  const productiveTime = 0;

  const productivityPercentage = 0;

  // Create a new rule

  // Delete a rule
  const deleteRule = (ruleId: string) => {};

  // Handle classification updates
  const handleClassification = (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: number,
    isProductive: boolean
  ) => {};
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!rules) {
    return <div>Failed to load rules</div>;
  }
  const classificationProgress = classifiedActivities / totalActivities;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Focus Sessions Achievement</h1>
        <RulesPanel rules={rules} onDeleteRule={deleteRule} />
      </div>

      <SummaryCard
        totalFocusTime={totalFocusTime}
        totalSessions={totalSessions}
        productivityPercentage={productivityPercentage}
        classificationProgress={classificationProgress}
      />

      <SessionList onClassify={handleClassification} />
      <div className="h-20" />
    </div>
  );
}

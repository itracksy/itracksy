import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ActivityGroup } from "./activity-group";

import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TimeEntryWithRelations } from "@/types/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { OnClassify } from "@/types/classify";

import { useUpdateRule } from "@/hooks/use-update-rule";
import { useCreateRule } from "@/hooks/use-create-rule";

import { getTitleTimeEntry } from "@/api/db/timeEntryExt";

interface SessionCardProps {
  session: TimeEntryWithRelations;

  isExpanded: boolean;
  onToggle: () => void;
}

export function SessionCard({
  session,

  isExpanded,
  onToggle,
}: SessionCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["activities", session.id],
    queryFn: () => trpcClient.timeEntry.getGroupActivitiesForTimeEntry.query(session.id),
    enabled: true,
  });
  const { activities = null, groupedActivities, productivityMetrics } = data ?? {};
  // Mutation for setting activity rating
  const ratingMutation = useMutation({
    mutationFn: ({ timestamp, rating }: { timestamp: number; rating: number }) =>
      trpcClient.activity.setActivityRating.mutate({ timestamp, rating }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", session.id] });
    },
  });
  const updateRuleMutation = useUpdateRule({
    activities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", session.id] });
    },
  });
  const createRuleMutation = useCreateRule({
    activities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", session.id] });
    },
  });

  // Handle classification updates
  const handleClassification: OnClassify = ({
    ruleId,
    appName,
    domain: domainName,
    activityId,
    isProductive,
  }) => {
    if (activityId) {
      ratingMutation.mutate({
        timestamp: activityId,
        rating: isProductive ? 1 : 0,
      });

      return;
    }

    if (ruleId) {
      updateRuleMutation.mutate({
        id: ruleId,
        rating: isProductive ? 1 : 0,
      });
    } else {
      if (domainName) {
        createRuleMutation.mutate({
          name: `Rule for ${domainName}`,
          description: `Created from activity`,
          domain: domainName,
          appName: appName,
          rating: isProductive ? 1 : 0,
          active: true,
          duration: 0,
          title: "",
          titleCondition: "",
          durationCondition: "",
        });
      } else {
        createRuleMutation.mutate({
          name: `Rule for ${appName}`,
          description: `Created from activity`,
          appName: appName,
          rating: isProductive ? 1 : 0,
          active: true,
          duration: 0,
          title: "",
          titleCondition: "",
          durationCondition: "",
          domain: "",
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!activities) {
    return <div>Failed to load activities</div>;
  }
  if (!groupedActivities) {
    return <div>Failed to load grouped activities</div>;
  }
  if (!productivityMetrics) {
    return <div>Failed to load productivity metrics</div>;
  }

  return (
    <Card
      className={cn(
        "border transition-all duration-300",
        isExpanded ? "shadow-md" : "shadow-sm",
        showCelebration ? "border-[#E5A853]" : "border-gray-200 dark:border-gray-700"
      )}
    >
      <CardHeader
        className={cn(
          "flex cursor-pointer flex-row items-center justify-between p-4",
          isExpanded ? "border-b dark:border-gray-700" : ""
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {getTitleTimeEntry(session)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {session.endTime ? formatTime(productivityMetrics.sessionDuration) : "Ongoing"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {productivityMetrics.classificationStatus === "complete" && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Fully Classified
              </span>
            )}
            {productivityMetrics.classificationStatus === "partial" && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Partially Classified
              </span>
            )}
            {productivityMetrics.classificationStatus === "unclassified" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Unclassified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {productivityMetrics.classificationStatus !== "unclassified" && (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {productivityMetrics.productivityPercentage}% Productive
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="divide-y dark:divide-gray-700">
            {Object.entries(groupedActivities).map(([appName, activities]) => (
              <ActivityGroup
                key={`${session.id}-${appName}`}
                sessionId={session.id}
                appName={appName}
                groupActivity={activities}
                rule={activities.rule}
                onClassify={handleClassification}
              />
            ))}
          </div>

          {showCelebration && (
            <div className="border-t border-[#E5A853]/30 bg-[#E5A853]/10 p-4 text-center dark:bg-[#E5A853]/5">
              <p className="font-medium text-[#2B4474] dark:text-[#3A5A9B]">
                🎉 All activities classified! Your session is now{" "}
                {productivityMetrics.productivityPercentage}% productive.
              </p>
            </div>
          )}

          <div className="border-t bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session Summary
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {productivityMetrics.classifiedActivities} of{" "}
                  {productivityMetrics.totalActivities} activities classified
                </p>
              </div>

              {productivityMetrics.classificationStatus !== "unclassified" && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-[#E5A853]"
                      style={{ width: `${productivityMetrics.productivityPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {productivityMetrics.productivityPercentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ActivityGroup } from "./activity-group";
import { Progress } from "@/components/ui/progress";

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

export function SessionCard({ session, isExpanded, onToggle }: SessionCardProps) {
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
    return (
      <Card className="animate-pulse border-gray-200 dark:border-gray-700">
        <CardHeader className="p-4">
          <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
      </Card>
    );
  }

  if (!activities || !groupedActivities || !productivityMetrics) {
    return null;
  }

  const sessionDate = format(session.startTime, "EEE, MMM d");
  const sessionTime = format(session.startTime, "h:mm a");
  const classificationPercent = Math.round(
    (productivityMetrics.classifiedActivities / productivityMetrics.totalActivities) * 100
  );

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isExpanded
          ? "border-blue-200 shadow-md dark:border-blue-800"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      )}
    >
      <CardHeader
        className="flex cursor-pointer flex-row items-center gap-4 p-4"
        onClick={onToggle}
      >
        {/* Expand/Collapse Icon */}
        <div className="text-gray-400 dark:text-gray-500">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>

        {/* Session Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {getTitleTimeEntry(session)}
            </h3>
            <StatusBadge status={productivityMetrics.classificationStatus} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {sessionDate} at {sessionTime}
            </span>
            <span>·</span>
            <span>
              {session.endTime ? formatTime(productivityMetrics.sessionDuration) : "Ongoing"}
            </span>
          </div>
        </div>

        {/* Productivity Indicator */}
        <div className="flex items-center gap-4">
          {productivityMetrics.classificationStatus !== "unclassified" && (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={cn(
                      "h-full transition-all",
                      productivityMetrics.productivityPercentage >= 70
                        ? "bg-green-500"
                        : productivityMetrics.productivityPercentage >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${productivityMetrics.productivityPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {productivityMetrics.productivityPercentage}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {productivityMetrics.classifiedActivities}/{productivityMetrics.totalActivities}{" "}
                classified
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t bg-gray-50 p-0 dark:border-gray-700 dark:bg-gray-800/50">
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
        </CardContent>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="h-3 w-3" />
        Complete
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Partial
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      <HelpCircle className="h-3 w-3" />
      Unclassified
    </span>
  );
}

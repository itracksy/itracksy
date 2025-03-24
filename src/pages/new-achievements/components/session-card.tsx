import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ActivityGroup } from "./activity-group";

import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TimeEntry } from "@/types/projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { OnClassify } from "@/types/classify";

import { useUpdateRule } from "@/hooks/use-update-rule";
import { useCreateRule } from "@/hooks/use-create-rule";

interface SessionCardProps {
  session: TimeEntry;

  isExpanded: boolean;
  onToggle: () => void;
}

export function SessionCard({
  session,

  isExpanded,
  onToggle,
}: SessionCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevClassifiedCount, setPrevClassifiedCount] = useState(0);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["activities", session.id],
    queryFn: () => trpcClient.timeEntry.getGroupActivitiesForTimeEntry.query(session.id),
    enabled: true,
  });
  const { activities = null, groupedActivities } = data ?? {};
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
          ruleType: "domain",
          condition: "contains",
          value: domainName,
          rating: isProductive ? 1 : 0,
          active: true,
        });
      } else {
        createRuleMutation.mutate({
          name: `Rule for ${appName}`,
          description: `Created from activity`,
          ruleType: "app_name",
          condition: "contains",
          value: appName,
          rating: isProductive ? 1 : 0,
          active: true,
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
  // Calculate classification status
  const totalActivities = activities.length;
  const classifiedActivities = activities.filter((a) => a.rating !== null).length;

  let classificationStatus: "unclassified" | "partial" | "complete" = "unclassified";
  if (classifiedActivities === totalActivities) {
    classificationStatus = "complete";
  } else if (classifiedActivities > 0) {
    classificationStatus = "partial";
  }

  // Calculate productivity for this session
  const productiveTime = activities
    .filter((activity) => activity.rating === 1)
    .reduce((total, activity) => total + activity.duration, 0);

  const productivityPercentage =
    (session.duration ?? 0) > 0 ? Math.round((productiveTime / (session.duration ?? 0)) * 100) : 0;

  return (
    <Card
      className={cn(
        "border transition-all duration-300",
        isExpanded ? "shadow-md" : "shadow-sm",
        showCelebration ? "border-[#E5A853]" : "border-gray-200"
      )}
    >
      <CardHeader
        className={cn(
          "flex cursor-pointer flex-row items-center justify-between p-4",
          isExpanded ? "border-b" : ""
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="font-medium text-gray-900">
              {format(new Date(session.startTime), "MMMM d, yyyy")}
            </h3>
            <p className="text-sm text-gray-500">{formatTime(session.duration ?? 0)}</p>
          </div>

          <div className="flex items-center gap-1.5">
            {classificationStatus === "complete" && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Fully Classified
              </span>
            )}
            {classificationStatus === "partial" && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Partially Classified
              </span>
            )}
            {classificationStatus === "unclassified" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Unclassified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {classificationStatus !== "unclassified" && (
            <div className="text-sm font-medium text-gray-700">
              {productivityPercentage}% Productive
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="divide-y">
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
            <div className="border-t border-[#E5A853]/30 bg-[#E5A853]/10 p-4 text-center">
              <p className="font-medium text-[#2B4474]">
                🎉 All activities classified! Your session is now {productivityPercentage}%
                productive.
              </p>
            </div>
          )}

          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Session Summary</p>
                <p className="text-xs text-gray-500">
                  {classifiedActivities} of {totalActivities} activities classified
                </p>
              </div>

              {classificationStatus !== "unclassified" && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-[#E5A853]"
                      style={{ width: `${productivityPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {productivityPercentage}%
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

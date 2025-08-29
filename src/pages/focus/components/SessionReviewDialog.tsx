import { useState } from "react";
import { format } from "date-fns";
import { History } from "lucide-react";
import { ActivityGroup } from "@/pages/new-activity-classification/components/activity-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TimeEntryWithRelations } from "@/types/projects";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { OnClassify } from "@/types/classify";
import { useUpdateRule } from "@/hooks/use-update-rule";
import { useCreateRule } from "@/hooks/use-create-rule";

interface SessionReviewDialogProps {
  session: TimeEntryWithRelations | null;
  trigger?: React.ReactNode;
}

export function SessionReviewDialog({ session, trigger }: SessionReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["activities", session?.id],
    queryFn: () => {
      if (!session?.id) return null;
      return trpcClient.timeEntry.getGroupActivitiesForTimeEntry.query(session.id);
    },
    enabled: !!session?.id && isOpen,
  });

  const { activities = null, groupedActivities, productivityMetrics } = data ?? {};

  // Mutation for setting activity rating
  const ratingMutation = useMutation({
    mutationFn: ({ timestamp, rating }: { timestamp: number; rating: number }) =>
      trpcClient.activity.setActivityRating.mutate({ timestamp, rating }),
    onSuccess: () => {
      // Invalidate queries when ratings are updated
      queryClient.invalidateQueries({ queryKey: ["activities", session?.id] });
    },
  });

  const updateRuleMutation = useUpdateRule({
    activities,
    onSuccess: () => {
      // Invalidate queries when rules are updated
      queryClient.invalidateQueries({ queryKey: ["activities", session?.id] });
    },
  });

  const createRuleMutation = useCreateRule({
    activities,
    onSuccess: () => {
      // Invalidate queries when rules are created
      queryClient.invalidateQueries({ queryKey: ["activities", session?.id] });
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

  if (!session) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <History className="h-4 w-4" />
      Review Session
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {session.isFocusMode ? "Focus" : "Break"} Session Review
          </DialogTitle>
          <DialogDescription>
            {session.endTime
              ? `Session from ${format(session.startTime, "MMM d, yyyy 'at' h:mm a")}`
              : "Current active session"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Activities - Main Focus */}
          {!isLoading && data && (
            <>
              {groupedActivities && Object.keys(groupedActivities).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Session Activities</h3>
                    {productivityMetrics && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {productivityMetrics.classifiedActivities} of{" "}
                          {productivityMetrics.totalActivities} classified
                        </span>
                        {productivityMetrics.classificationStatus !== "unclassified" && (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full bg-[#E5A853]"
                                style={{ width: `${productivityMetrics.productivityPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {productivityMetrics.productivityPercentage}% Productive
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
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
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-2 text-gray-500 dark:text-gray-400">
                    <History className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">No Activities Recorded</p>
                    <p className="text-sm">This session doesn't have any tracked activities yet.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#E5A853]"></div>
                <div className="text-gray-500">Loading session activities...</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

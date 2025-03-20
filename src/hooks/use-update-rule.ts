import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "@/hooks/use-toast";
import { Activity } from "@/types/activity";
import { findActivitiesMatchingRule } from "@/utils/activityUtils";
import { RuleFormValues } from "@/components/rules/rule-dialog";

interface UseUpdateRuleOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  timeEntryId?: string;
  activities?: Activity[];
}

export function useUpdateRule({
  onSuccess,
  onError,
  timeEntryId,
  activities,
}: UseUpdateRuleOptions = {}) {
  const queryClient = useQueryClient();

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => {
      return trpcClient.activity.updateRule.mutate({ id, rating });
    },
    onError: (error) => {
      toast({
        title: "Error updating rule",
        description: error.message,
        variant: "destructive",
      });

      if (onError) {
        onError(error);
      }
    },
    onSuccess: (data) => {
      // Handle updating activities that match the rule
      if (activities?.length && data) {
        const unRatedActivities = activities.filter((activity) => activity.rating === null);

        if (unRatedActivities?.length) {
          // Find activities that match the updated rule and update their ratings
          const activitiesToRate = findActivitiesMatchingRule(unRatedActivities, {
            ruleType: data.ruleType,
            condition: data.condition,
            value: data.value,
            rating: data.rating,
          } as RuleFormValues);

          activitiesToRate.forEach((activity) => {
            trpcClient.activity.setActivityRating.mutate({
              timestamp: activity.timestamp,
              rating: data.rating,
            });
          });
        }
      }

      // Invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      if (timeEntryId) {
        queryClient.invalidateQueries({ queryKey: ["activities", timeEntryId] });
      }

      toast({
        title: "Rule updated",
        description: "Your activity rule has been updated successfully",
      });

      // Call custom onSuccess if provided
      if (onSuccess) {
        onSuccess(data);
      }
    },
  });

  return updateRuleMutation;
}

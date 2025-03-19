import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { RuleFormValues } from "@/components/rules/rule-dialog";
import { Activity } from "@/types/activity";
import { toast } from "@/hooks/use-toast";
import { findActivitiesMatchingRule } from "@/utils/activityUtils";

interface UseCreateRuleOptions {
  onSuccess?: (values: RuleFormValues) => void;
  timeEntryId?: string;
  activities?: Activity[];
}

export function useCreateRule({ onSuccess, timeEntryId, activities }: UseCreateRuleOptions = {}) {
  const queryClient = useQueryClient();

  const createRuleMutation = useMutation({
    mutationFn: (values: RuleFormValues) => trpcClient.activity.createRule.mutate(values),
    onSuccess: (values) => {
      // when a rule is created, find all activities that match the rule and set their rating
      if (activities?.length) {
        const unRatedActivities = activities.filter((activity) => activity.rating === null);

        if (unRatedActivities?.length) {
          const activitiesToRate = findActivitiesMatchingRule(
            unRatedActivities,
            values as RuleFormValues
          );

          activitiesToRate.forEach((activity) => {
            trpcClient.activity.setActivityRating.mutate({
              timestamp: activity.timestamp,
              rating: values.rating,
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
        title: "Rule created",
        description: "Your activity rule has been created successfully",
      });

      // Call custom onSuccess if provided
      if (onSuccess) {
        onSuccess(values as RuleFormValues);
      }
    },
  });

  return createRuleMutation;
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { RuleFormValues } from "@/components/rules/rule-dialog";
import { Activity } from "@/types/activity";
import { toast } from "@/hooks/use-toast";
import { findActivitiesMatchingRule } from "@/utils/activityUtils";

interface UseCreateRuleOptions {
  onSuccess?: (values: RuleFormValues) => void;
  onError?: (error: Error) => void;
  timeEntryId?: string;
  activities: Activity[] | null;
}

export function useCreateRule(
  { onSuccess, onError, timeEntryId, activities }: UseCreateRuleOptions = { activities: null }
) {
  const queryClient = useQueryClient();

  const createRuleMutation = useMutation({
    mutationFn: async (values: RuleFormValues) => {
      try {
        return await trpcClient.activity.createRule.mutate(values);
      } catch (error) {
        // Check if error is related to a unique constraint violation
        if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
          throw new Error("A similar rule already exists. Please modify your rule.");
        }
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating rule",
        description: error.message,
        variant: "destructive",
      });

      if (onError) {
        onError(error);
      }
    },
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

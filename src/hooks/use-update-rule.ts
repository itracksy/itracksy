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
  activities: Activity[] | null;
}

export function useUpdateRule(
  { onSuccess, onError, timeEntryId, activities }: UseUpdateRuleOptions = { activities: null }
) {
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
        // Find activities that match the updated rule and update their ratings
        const activitiesToRate = findActivitiesMatchingRule(activities, {
          appName: data.appName,
          domain: data.domain,
          titleCondition: data.titleCondition as any,
          title: data.title || "",
          durationCondition: data.durationCondition as any,
          duration: data.duration || 0,
          rating: data.rating,
          name: data.name,
          description: data.description || "",
          active: data.active,
        });

        activitiesToRate.forEach((activity) => {
          trpcClient.activity.setActivityRating.mutate({
            timestamp: activity.timestamp,
            rating: data.rating,
            ruleId: data.id, // Set the rule ID reference
          });
        });
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

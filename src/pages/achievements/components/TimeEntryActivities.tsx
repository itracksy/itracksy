import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import { trpcClient } from "@/utils/trpc";
import { formatDuration } from "@/utils/formatTime";
import { Activity } from "@/types/activity";
import { toast } from "@/hooks/use-toast";
import { RuleDialog, RuleFormValues } from "@/components/rules/rule-dialog";
import { AppRuleButtons, DomainRuleButtons } from "@/components/rules/rule-buttons";

import { ActivityItem } from "./ActivityItem";
import { useCreateRule } from "@/hooks/use-create-rule";
import { useUpdateRule } from "@/hooks/use-update-rule";
import { extractDomain } from "@/utils/url";

export function TimeEntryActivities({ timeEntryId }: { timeEntryId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["activities", timeEntryId],
    queryFn: () => trpcClient.timeEntry.getGroupActivitiesForTimeEntry.query(timeEntryId),
    enabled: true,
  });
  const { activities, groupedActivities } = data ?? {};

  const queryClient = useQueryClient();

  // Track expanded app and domain groups
  const [expandedApps, setExpandedApps] = useState<string[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);

  // Mutation for setting activity rating
  const ratingMutation = useMutation({
    mutationFn: ({ timestamp, rating }: { timestamp: number; rating: number }) =>
      trpcClient.activity.setActivityRating.mutate({ timestamp, rating }),
    onSuccess: (data) => {
      console.log("ratingMutation", data);
      if (data.rating === 0) {
        createRuleFromActivity(data);
      }
      queryClient.invalidateQueries({ queryKey: ["activities", timeEntryId] });
    },
  });

  // Use the custom hook for creating rules
  const createRuleMutation = useCreateRule({
    timeEntryId,
    activities,
    onSuccess: () => {
      toast({
        title: "Rule created",
        description: "Your productivity rule has been created successfully",
      });
    },
  });

  // Use the custom hook for updating rules
  const updateRuleMutation = useUpdateRule({
    timeEntryId,
    activities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", timeEntryId] });
    },
  });

  // Function to handle rule update
  const handleUpdateRule = (params: {
    id: string | null;
    rating: number;
    domain?: string;
    appName: string;
  }) => {
    if (params.id) {
      updateRuleMutation.mutate({
        id: params.id,
        rating: params.rating,
      });
    } else {
      if (params.domain) {
        createRuleMutation.mutate({
          name: `Rule for ${params.domain}`,
          description: `Created from activity`,
          ruleType: "domain",
          condition: "contains",
          value: params.domain,
          rating: params.rating,
          active: true,
        });
      } else {
        createRuleMutation.mutate({
          name: `Rule for ${params.appName}`,
          description: `Created from activity`,
          ruleType: "app_name",
          condition: "contains",
          value: params.appName,
          rating: params.rating,
          active: true,
        });
      }
    }
  };

  // Function to handle rule submission
  const handleRuleSubmit = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  // Function to rate an activity
  const handleRateActivity = (activity: Activity, rating: number) => {
    ratingMutation.mutate({ timestamp: activity.timestamp, rating });
  };

  // Function to create rule from activity
  const createRuleFromActivity = (activity: Activity) => {
    const value = activity.url || activity.title || activity.ownerName;
    const ruleType = activity.url ? "url" : "title";
    console.log("createRuleFromActivity", activity);
    createRuleMutation.mutate({
      name: `Rule for ${activity.ownerName}`,
      description: `Created from activity: ${activity.title}`,
      ruleType: ruleType,
      condition: "contains",
      value: value,
      rating: activity.rating ?? 0,
      active: true,
      appName: activity.ownerName,
      domain: activity.url ?? (extractDomain(activity.url) || undefined),
    });
  };

  // Toggle expansion for app groups
  const toggleAppExpansion = (appName: string) => {
    setExpandedApps((prev) =>
      prev.includes(appName) ? prev.filter((name) => name !== appName) : [...prev, appName]
    );
  };

  // Toggle expansion for domain groups
  const toggleDomainExpansion = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId) ? prev.filter((id) => id !== domainId) : [...prev, domainId]
    );
  };

  if (isLoading) {
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">No activities recorded</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Activities</h4>
      <div className="space-y-2">
        {groupedActivities &&
          Object.values(groupedActivities).map((appGroup) => (
            <div key={appGroup.appName} className="rounded-md bg-muted/20">
              {/* App Group Header */}
              <div className="flex items-center justify-between rounded-t-md bg-muted/40 p-3">
                <button
                  type="button"
                  className="flex items-center gap-2 text-left"
                  onClick={() => toggleAppExpansion(appGroup.appName)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedApps.includes(appGroup.appName) ? "rotate-180 transform" : ""
                    }`}
                  />
                  <span className="font-medium">{appGroup.appName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatDuration(appGroup.totalDuration)})
                  </span>
                </button>

                {/* App level rule buttons - using the reusable component */}
                <AppRuleButtons
                  rule={appGroup.rule || null}
                  appName={appGroup.appName}
                  onUpdateRule={handleUpdateRule}
                />
              </div>

              {/* App Group Content */}
              {expandedApps.includes(appGroup.appName) && (
                <div className="space-y-2 p-2">
                  {/* Activities without URL */}
                  {appGroup.activitiesWithoutUrl.length > 0 && (
                    <div className="space-y-2 pl-4">
                      {appGroup.activitiesWithoutUrl.map((activity) => (
                        <ActivityItem
                          key={activity.timestamp}
                          activity={activity}
                          handleRateActivity={handleRateActivity}
                          isPending={ratingMutation.isPending}
                        />
                      ))}
                    </div>
                  )}

                  {/* Domain Groups */}
                  {Object.values(appGroup.domains).map((domainGroup) => {
                    const domainId = `${appGroup.appName}-${domainGroup.domain}`;

                    return (
                      <div key={domainId} className="rounded-md bg-muted/10">
                        {/* Domain Group Header */}
                        <div className="flex items-center justify-between bg-muted/30 p-2 pl-6">
                          <div
                            className="flex cursor-pointer items-center gap-2"
                            onClick={() => toggleDomainExpansion(domainId)}
                          >
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                expandedDomains.includes(domainId) ? "rotate-180 transform" : ""
                              }`}
                            />
                            <span className="text-sm font-medium">{domainGroup.domain}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatDuration(domainGroup.totalDuration)})
                            </span>
                          </div>

                          {/* Domain level rule button - using the reusable component */}
                          <DomainRuleButtons
                            rule={domainGroup.rule || null}
                            appName={appGroup.appName}
                            domain={domainGroup.domain}
                            onUpdateRule={handleUpdateRule}
                          />
                        </div>

                        {/* Domain Group Content */}
                        {expandedDomains.includes(domainId) && (
                          <div className="space-y-2 p-2 pl-8">
                            {domainGroup.activities.map((activity) => (
                              <ActivityItem
                                key={activity.timestamp}
                                activity={activity}
                                handleRateActivity={handleRateActivity}
                                isPending={ratingMutation.isPending}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

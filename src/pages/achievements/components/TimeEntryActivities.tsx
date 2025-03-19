import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import { trpcClient } from "@/utils/trpc";
import { formatDuration } from "@/utils/formatTime";
import { Activity } from "@/types/activity";
import { toast } from "@/hooks/use-toast";
import { RuleDialog, RuleFormValues } from "@/components/rules/rule-dialog";
import { extractDomain, groupActivities, findActivitiesMatchingRule } from "@/utils/activityUtils";
import { ActivityItem } from "./ActivityItem";

export function TimeEntryActivities({ timeEntryId }: { timeEntryId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", timeEntryId],
    queryFn: () => trpcClient.timeEntry.getActivitiesForTimeEntry.query(timeEntryId),
    enabled: true,
  });

  const queryClient = useQueryClient();

  // Track expanded app and domain groups
  const [expandedApps, setExpandedApps] = useState<string[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);

  // Rule dialog state
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [ruleDefaults, setRuleDefaults] = useState<RuleFormValues | undefined>();

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

  // Mutation for creating rules
  const createRuleMutation = useMutation({
    mutationFn: (values: RuleFormValues) => trpcClient.activity.createRule.mutate(values),
    onSuccess: (values) => {
      // when a rule is created, find all activities that match the rule and set their rating
      const unRatedActivities = activities?.filter((activity) => activity.rating === null);
      console.log("unRatedActivities", unRatedActivities);
      console.log("activities", activities);
      if (unRatedActivities?.length) {
        const activitiesToRate = findActivitiesMatchingRule(
          unRatedActivities,
          values as RuleFormValues
        );

        activitiesToRate.forEach((activity) => {
          ratingMutation.mutate({ timestamp: activity.timestamp, rating: values.rating });
        });
      }

      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      toast({
        title: "Rule created",
        description: "Your activity rule has been created successfully",
      });
      setIsRuleDialogOpen(false);
    },
  });

  // Function to open rule dialog for an app
  const openAppRuleDialog = (appName: string) => {
    setRuleDefaults({
      name: `Block ${appName}`,
      description: `Block the application: ${appName}`,
      ruleType: "app_name",
      condition: "=",
      value: appName,
      rating: 0, // Distracting by default for blocking
      active: true,
    });
    setIsRuleDialogOpen(true);
  };

  // Function to open rule dialog for a domain
  const openDomainRuleDialog = (appName: string, domain: string) => {
    setRuleDefaults({
      name: `Block ${domain}`,
      description: `Block the domain: ${domain}`,
      ruleType: "domain",
      appName: appName,
      condition: "=",
      value: domain,
      rating: 0, // Distracting by default for blocking
      active: true,
    });
    setIsRuleDialogOpen(true);
  };

  // Function to handle rule submission
  const handleRuleSubmit = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  // Function to handle dialog close
  const handleRuleDialogClose = (open: boolean) => {
    if (!open) {
      setIsRuleDialogOpen(false);
      setRuleDefaults(undefined);
    }
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
    setRuleDefaults({
      name: `Rule for ${activity.ownerName}`,
      description: `Created from activity: ${activity.title}`,
      ruleType: ruleType,
      condition: "contains",
      value: value,
      rating: activity.rating ?? 0,
      active: true,
      appName: activity.ownerName,
      domain: activity.url ? extractDomain(activity.url) : undefined,
    });
    setIsRuleDialogOpen(true);
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

  // Group activities by app and domain
  const groupedActivities = groupActivities(activities);

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Activities</h4>
      <div className="space-y-2">
        {Object.values(groupedActivities).map((appGroup) => (
          <div key={appGroup.appName} className="rounded-md bg-muted/20">
            {/* App Group Header */}
            <div className="flex items-center justify-between rounded-t-md bg-muted/40 p-3">
              <div
                className="flex cursor-pointer items-center gap-2"
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
              </div>

              {/* App level rule button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAppRuleDialog(appGroup.appName);
                }}
              >
                <Shield className="h-3 w-3" />
                <span>Block App</span>
              </Button>
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

                        {/* Domain level rule button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDomainRuleDialog(appGroup.appName, domainGroup.domain);
                          }}
                        >
                          <Shield className="h-3 w-3" />
                          <span>Block Domain</span>
                        </Button>
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

      {/* Rule Dialog */}
      <RuleDialog
        open={isRuleDialogOpen}
        onOpenChange={handleRuleDialogClose}
        onSubmit={handleRuleSubmit}
        defaultValues={ruleDefaults}
        isSubmitting={createRuleMutation.isPending}
        mode="create"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Monitor, CheckCircle, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { formatTime } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { RulesBadge } from "./rules-badge";
import { RulesInfo } from "./rules-info";
import { ActivityRule, GroupActivity } from "@/types/activity";
import { OnClassify } from "@/types/classify";
import { isNonEmptyObject } from "@/utils/value-checks";
import { RuleDialog } from "@/components/rules/rule-dialog";
import { useCreateRule } from "@/hooks/use-create-rule";
import { DomainGroup } from "./domain-group";
import { ActivityItem } from "./activity-item";
import { trpcClient } from "@/utils/trpc";
import { RuleFormValues } from "@/types/rule";

interface RuleDialogState {
  isOpen: boolean;
  acitivityId: number | null;
  prefillValues: RuleFormValues | undefined;
}

interface ActivityGroupProps {
  sessionId: string;
  appName: string;
  groupActivity: GroupActivity;
  rule?: ActivityRule;
  onClassify: OnClassify;
}

export function ActivityGroup({
  sessionId,
  appName,
  groupActivity,
  onClassify,
}: ActivityGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // Reference to activities for more convenient access
  const activities = groupActivity.activitiesWithoutUrl;

  // Group activities by domain
  const domainGroups = groupActivity.domains;
  const isBrowser = isNonEmptyObject(domainGroups);
  // Calculate app-level statistics
  const totalAppTime = activities.reduce((total, activity) => total + activity.duration, 0);
  const classifiedActivities = activities.filter((a) => a.rating !== null).length;
  const allClassified = classifiedActivities === activities.length;
  const anyClassified = classifiedActivities > 0;

  // Check if all activities in the app are productive
  const productiveActivities = activities.filter((a) => a.rating === 1).length;
  const allProductive = productiveActivities === activities.length && allClassified;
  const allDistracted = productiveActivities === 0 && allClassified;

  // Check if there's a rule for this app
  const appRule = groupActivity.rule;

  // Handle app-level classification
  const handleAppClassification = (isProductive: boolean) => {
    onClassify({
      ruleId: appRule?.id ?? null,
      appName,
      domain: null,
      activityId: null,
      isProductive,
    });
  };

  // Add state for rule dialog
  const [ruleDialog, setRuleDialog] = useState<RuleDialogState>({
    isOpen: false,
    prefillValues: undefined,
    acitivityId: null,
  });

  const queryClient = useQueryClient();

  // Setup the create rule mutation
  const createRuleMutation = useCreateRule({
    activities: [
      ...groupActivity.activitiesWithoutUrl,
      ...Object.values(groupActivity.domains).flatMap((d) => d.activities),
    ],
    onSuccess: () => {
      // Close dialog and refresh data
      setRuleDialog({ isOpen: false, acitivityId: null, prefillValues: undefined });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  // Function to handle rule dialog submission
  const handleRuleSubmit = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  return (
    <div className="bg-white dark:bg-gray-800" data-activitygroup>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#2B4474] p-2">
            <Monitor className="h-5 w-5 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{appName}</h4>
            {appRule && !isBrowser && <RulesBadge isProductive={appRule.rating === 1} />}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(totalAppTime)}</p>
          </div>

          {!allClassified && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                anyClassified
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              {anyClassified ? "Partially Classified" : "Unclassified"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isBrowser ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Toggle
                pressed={allProductive}
                onPressedChange={() => handleAppClassification(true)}
                className={cn(
                  appRule?.rating === 1
                    ? "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "",
                  "h-8 border px-2"
                )}
                aria-label="Mark all app activities as productive"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Productive
              </Toggle>

              <Toggle
                pressed={allDistracted}
                onPressedChange={() => handleAppClassification(false)}
                className={cn(
                  appRule?.rating === 0
                    ? "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : "",
                  "h-8 border px-2"
                )}
                aria-label="Mark all app activities as distracting"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Distracting
              </Toggle>

              <RulesInfo />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">It is browser</span>
            </div>
          )}

          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="divide-y border-t pl-12 dark:divide-gray-700 dark:border-gray-700">
          {Object.entries(domainGroups).map(([domain, domainActivities]) => (
            <DomainGroup
              key={`${sessionId}-${appName}-${domain}`}
              onUpsertRule={(activity) => {
                setRuleDialog({
                  isOpen: true,
                  acitivityId: activity.timestamp,
                  prefillValues: {
                    appName,

                    title: activity.title,
                    duration: 0,
                    rating: domainActivities.rule?.rating === 1 ? 0 : 1,
                    name: activity.title,
                    description: "",
                    titleCondition: "contains",
                    durationCondition: "",
                    domain: domain,
                    active: true,
                  },
                });
              }}
              appName={appName}
              domain={domain}
              activities={domainActivities.activities}
              rule={domainActivities.rule}
              onClassify={onClassify}
            />
          ))}
        </div>
      )}
      {expanded && (
        <div className="divide-y border-t dark:divide-gray-700 dark:border-gray-700">
          {activities.map((activity) => (
            <ActivityItem
              onUpsertRule={(ruleId) => {
                if (ruleId) {
                  // If ruleId has value, fetch rule details from trpcClient
                  trpcClient.activity.getRuleById.query({ ruleId }).then((rule) => {
                    if (rule) {
                      setRuleDialog({
                        isOpen: true,
                        acitivityId: activity.timestamp,
                        prefillValues: {
                          appName: rule.appName,
                          title: rule.title || activity.title,
                          duration: rule.duration || 0,
                          rating: rule.rating,
                          name: rule.name,
                          description: rule.description || "",
                          titleCondition: (rule.titleCondition as any) || "contains",
                          durationCondition: (rule.durationCondition as any) || "",
                          domain: rule.domain || "",
                          active: rule.active,
                        },
                      });
                    }
                  });
                } else {
                  setRuleDialog({
                    isOpen: true,
                    acitivityId: activity.timestamp,
                    prefillValues: {
                      appName,
                      title: activity.title,
                      duration: 0,
                      rating: appRule?.rating === 1 ? 0 : 1,
                      name: activity.title,
                      description: "",
                      titleCondition: "contains",
                      durationCondition: "",
                      domain: "",
                      active: true,
                    },
                  });
                }
              }}
              key={activity.timestamp}
              ruleRating={appRule?.rating ?? null}
              activity={activity}
            />
          ))}
        </div>
      )}

      <RuleDialog
        open={ruleDialog.isOpen}
        onOpenChange={(open) =>
          setRuleDialog({
            isOpen: open,
            acitivityId: open ? ruleDialog.acitivityId : null,
            prefillValues: open ? ruleDialog.prefillValues : undefined,
          })
        }
        onSubmit={handleRuleSubmit}
        defaultValues={ruleDialog.prefillValues}
        isSubmitting={createRuleMutation.isPending}
        mode={ruleDialog.acitivityId ? "edit" : "create"}
      />
    </div>
  );
}

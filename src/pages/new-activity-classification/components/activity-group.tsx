"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Monitor,
  ThumbsUp,
  ThumbsDown,
  Globe,
  MoreHorizontal,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RulesBadge } from "./rules-badge";
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
  const domainTime = Object.values(domainGroups).reduce(
    (total, group) => total + group.activities.reduce((t, a) => t + a.duration, 0),
    0
  );
  const totalTime = totalAppTime + domainTime;

  // Check if there's a rule for this app
  const appRule = groupActivity.rule;

  // Handle app-level classification
  const handleAppClassification = (isProductive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
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
      setRuleDialog({ isOpen: false, acitivityId: null, prefillValues: undefined });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  // Function to handle rule dialog submission
  const handleRuleSubmit = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  const domainCount = Object.keys(domainGroups).length;
  const activityCount = activities.length;

  return (
    <div className="bg-white dark:bg-gray-800" data-activitygroup>
      <div
        className="flex cursor-pointer items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand Icon */}
        <div className="text-gray-400 dark:text-gray-500">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        {/* App Icon */}
        <div
          className={cn(
            "rounded-lg p-2",
            appRule?.rating === 1
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : appRule?.rating === 0
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          )}
        >
          <Monitor className="h-4 w-4" />
        </div>

        {/* App Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">{appName}</span>
            {appRule && !isBrowser && <RulesBadge isProductive={appRule.rating === 1} />}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatTime(totalTime)}</span>
            {isBrowser && (
              <>
                <span>·</span>
                <span>
                  {domainCount} {domainCount === 1 ? "site" : "sites"}
                </span>
              </>
            )}
            {!isBrowser && activityCount > 1 && (
              <>
                <span>·</span>
                <span>{activityCount} activities</span>
              </>
            )}
          </div>
        </div>

        {/* Classification Buttons */}
        {!isBrowser && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleAppClassification(true, e)}
              className={cn(
                "h-8 px-3",
                appRule?.rating === 1
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                  : "text-gray-500 hover:bg-green-50 hover:text-green-600 dark:text-gray-400"
              )}
            >
              <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              Productive
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleAppClassification(false, e)}
              className={cn(
                "h-8 px-3",
                appRule?.rating === 0
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  : "text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400"
              )}
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
              Distracting
            </Button>
          </div>
        )}
      </div>

      {/* Domain Groups (for browsers) */}
      {expanded && isBrowser && (
        <div className="divide-y border-t bg-gray-50 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/50">
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

      {/* Individual Activities (for non-browsers) */}
      {expanded && !isBrowser && activities.length > 0 && (
        <div className="divide-y border-t bg-gray-50 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/50">
          {activities.map((activity) => (
            <ActivityItem
              onUpsertRule={(ruleId) => {
                if (ruleId) {
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

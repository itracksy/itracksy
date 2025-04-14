import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Globe, XCircle } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Activity, ActivityRule } from "@/types/activity";
import { OnClassify } from "@/types/classify";
import { RulesInfo } from "./rules-info";
import { RulesBadge } from "./rules-badge";
import { ActivityItem } from "./activity-item";

interface DomainGroupProps {
  onUpsertRule: (activity: Activity) => void;
  appName: string;
  domain: string | null;
  activities: Activity[];
  rule?: ActivityRule;
  onClassify: OnClassify;
}

export function DomainGroup({
  onUpsertRule,
  appName,
  domain,
  activities,
  rule,
  onClassify,
}: DomainGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate domain-level statistics
  const totalDomainTime = activities.reduce((total, activity) => total + activity.duration, 0);
  const classifiedActivities = activities.filter((a) => a.rating !== null).length;
  const allClassified = classifiedActivities === activities.length;
  const anyClassified = classifiedActivities > 0;

  // Check if all activities in the domain are productive
  const productiveActivities = activities.filter((a) => a.rating === 1).length;
  const allProductive = productiveActivities === activities.length && allClassified;
  const allDistracted = productiveActivities === 0 && allClassified;

  // Check if there's a rule for this domain
  const domainRule = rule;

  // Handle domain-level classification
  const handleDomainClassification = (isProductive: boolean) => {
    onClassify({ ruleId: domainRule?.id ?? null, appName, domain, activityId: null, isProductive });
  };

  return (
    <div>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#2B4474]/80 p-2">
            <Globe className="h-5 w-5 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <h5 className="font-medium text-gray-900 dark:text-gray-100">
              {domain || "No Domain"}
            </h5>
            {domainRule && <RulesBadge isProductive={domainRule.rating === 1} />}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(totalDomainTime)}
            </p>
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Toggle
              pressed={allProductive}
              onPressedChange={() => handleDomainClassification(true)}
              className={cn(
                rule?.rating === 1
                  ? "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "",
                "h-8 border px-2"
              )}
              aria-label="Mark all domain activities as productive"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Productive
            </Toggle>

            <Toggle
              pressed={allDistracted}
              onPressedChange={() => handleDomainClassification(false)}
              className={cn(
                rule?.rating === 0
                  ? "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : "",
                "h-8 border px-2"
              )}
              aria-label="Mark all domain activities as distracting"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Distracting
            </Toggle>

            <RulesInfo />
          </div>

          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="divide-y border-t dark:divide-gray-700 dark:border-gray-700">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.timestamp}
              onUpsertRule={() => onUpsertRule(activity)}
              ruleRating={rule?.rating ?? null}
              activity={activity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

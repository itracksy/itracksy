"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Monitor, Globe, CheckCircle, XCircle } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { RulesBadge } from "./rules-badge";
import { RulesInfo } from "./rules-info";
import { Activity, ActivityRule, GroupActivity } from "@/types/activity";
import { OnClassify } from "@/types/classify";
import { isNonEmptyObject } from "@/utils/value-checks";

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

  return (
    <div className="bg-white dark:bg-gray-800">
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
              sessionId={sessionId}
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
              key={activity.timestamp}
              sessionId={sessionId}
              appName={appName}
              domain={null}
              activity={activity}
              onClassify={onClassify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DomainGroupProps {
  sessionId: string;
  appName: string;
  domain: string | null;
  activities: Activity[];
  rule?: ActivityRule; // Updated type from Rule[] to ActivityRule[]
  onClassify: OnClassify;
}

function DomainGroup({
  sessionId,
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
              sessionId={sessionId}
              appName={appName}
              domain={domain}
              activity={activity}
              onClassify={onClassify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityItemProps {
  sessionId: string;
  appName: string;
  domain: string | null;
  activity: Activity;
  onClassify: OnClassify;
}

function ActivityItem({ sessionId, appName, domain, activity, onClassify }: ActivityItemProps) {
  // Handle activity-level classification
  const handleActivityClassification = (isProductive: boolean) => {
    onClassify({
      ruleId: null,
      appName,
      domain,
      activityId: activity.timestamp,
      isProductive,
    });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700/50",
        activity.rating === null &&
          "m-2 rounded-md border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          <h6 className="font-medium text-gray-900 dark:text-gray-100">{activity.title}</h6>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(activity.duration)}
          </p>
        </div>

        {activity.rating === null && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Unclassified
          </span>
        )}
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Toggle
          pressed={activity.rating === 1}
          onPressedChange={() => handleActivityClassification(true)}
          className={cn(
            activity.rating === 1
              ? "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "",
            "h-8 border px-2"
          )}
          aria-label="Mark activity as productive"
        >
          <CheckCircle className="mr-1 h-4 w-4" />
          Productive
        </Toggle>

        <Toggle
          pressed={activity.rating !== null && activity.rating === 0}
          onPressedChange={() => handleActivityClassification(false)}
          className={cn(
            activity.rating !== null && activity.rating === 0
              ? "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
              : "",
            "h-8 border px-2"
          )}
          aria-label="Mark activity as distracting"
        >
          <XCircle className="mr-1 h-4 w-4" />
          Distracting
        </Toggle>
      </div>
    </div>
  );
}

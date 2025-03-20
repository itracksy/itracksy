"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Monitor, Globe, CheckCircle, XCircle } from "lucide-react";
import type { Activity, Rule } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { RulesBadge } from "./rules-badge";
import { RulesInfo } from "./rules-info";

interface ActivityGroupProps {
  sessionId: string;
  appName: string;
  activities: Activity[];
  rules: Rule[];
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => void;
}

export function ActivityGroup({
  sessionId,
  appName,
  activities,
  rules,
  onClassify,
}: ActivityGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // Group activities by domain
  const domainGroups = activities.reduce(
    (groups, activity) => {
      const domainName = activity.domainName || "No Domain";
      if (!groups[domainName]) {
        groups[domainName] = [];
      }
      groups[domainName].push(activity);
      return groups;
    },
    {} as Record<string, typeof activities>
  );

  // Calculate app-level statistics
  const totalAppTime = activities.reduce((total, activity) => total + activity.duration, 0);
  const classifiedActivities = activities.filter((a) => a.isClassified).length;
  const allClassified = classifiedActivities === activities.length;
  const anyClassified = classifiedActivities > 0;

  // Check if all activities in the app are productive
  const productiveActivities = activities.filter((a) => a.isProductive).length;
  const allProductive = productiveActivities === activities.length && allClassified;
  const allDistracted = productiveActivities === 0 && allClassified;

  // Check if there's a rule for this app
  const appRule = rules.find((rule) => rule.type === "app" && rule.name === appName);

  // Handle app-level classification
  const handleAppClassification = (isProductive: boolean) => {
    onClassify(sessionId, appName, null, "", isProductive);
  };

  return (
    <div className="bg-white">
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#2B4474] p-2">
            <Monitor className="h-5 w-5 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{appName}</h4>
            {appRule && <RulesBadge isProductive={appRule.isProductive} />}
          </div>

          <div>
            <p className="text-sm text-gray-500">{formatTime(totalAppTime)}</p>
          </div>

          {!allClassified && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                anyClassified ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              )}
            >
              {anyClassified ? "Partially Classified" : "Unclassified"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Toggle
              pressed={allProductive}
              onPressedChange={() => handleAppClassification(true)}
              className={cn(
                "data-[state=on]:border-green-200 data-[state=on]:bg-green-100 data-[state=on]:text-green-800",
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
                "data-[state=on]:border-red-200 data-[state=on]:bg-red-100 data-[state=on]:text-red-800",
                "h-8 border px-2"
              )}
              aria-label="Mark all app activities as distracting"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Distracting
            </Toggle>

            <RulesInfo />
          </div>

          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="divide-y border-t pl-12">
          {Object.entries(domainGroups).map(([domainName, domainActivities]) => (
            <DomainGroup
              key={`${sessionId}-${appName}-${domainName}`}
              sessionId={sessionId}
              appName={appName}
              domainName={domainName === "No Domain" ? null : domainName}
              activities={domainActivities}
              rules={rules}
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
  domainName: string | null;
  activities: Activity[];
  rules: Rule[];
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => void;
}

function DomainGroup({
  sessionId,
  appName,
  domainName,
  activities,
  rules,
  onClassify,
}: DomainGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate domain-level statistics
  const totalDomainTime = activities.reduce((total, activity) => total + activity.duration, 0);
  const classifiedActivities = activities.filter((a) => a.isClassified).length;
  const allClassified = classifiedActivities === activities.length;
  const anyClassified = classifiedActivities > 0;

  // Check if all activities in the domain are productive
  const productiveActivities = activities.filter((a) => a.isProductive).length;
  const allProductive = productiveActivities === activities.length && allClassified;
  const allDistracted = productiveActivities === 0 && allClassified;

  // Check if there's a rule for this domain
  const domainRule = domainName
    ? rules.find((rule) => rule.type === "domain" && rule.name === domainName)
    : undefined;

  // Handle domain-level classification
  const handleDomainClassification = (isProductive: boolean) => {
    onClassify(sessionId, appName, domainName, "", isProductive);
  };

  return (
    <div>
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#2B4474]/80 p-2">
            <Globe className="h-5 w-5 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <h5 className="font-medium text-gray-900">{domainName || "No Domain"}</h5>
            {domainRule && <RulesBadge isProductive={domainRule.isProductive} />}
          </div>

          <div>
            <p className="text-sm text-gray-500">{formatTime(totalDomainTime)}</p>
          </div>

          {!allClassified && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                anyClassified ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              )}
            >
              {anyClassified ? "Partially Classified" : "Unclassified"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Toggle
              pressed={allProductive}
              onPressedChange={() => handleDomainClassification(true)}
              className={cn(
                "data-[state=on]:border-green-200 data-[state=on]:bg-green-100 data-[state=on]:text-green-800",
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
                "data-[state=on]:border-red-200 data-[state=on]:bg-red-100 data-[state=on]:text-red-800",
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
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="divide-y border-t">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              sessionId={sessionId}
              appName={appName}
              domainName={domainName}
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
  domainName: string | null;
  activity: Activity;
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => void;
}

function ActivityItem({ sessionId, appName, domainName, activity, onClassify }: ActivityItemProps) {
  // Handle activity-level classification
  const handleActivityClassification = (isProductive: boolean) => {
    onClassify(sessionId, appName, domainName, activity.id, isProductive);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 pl-12 hover:bg-gray-50",
        !activity.isClassified && "m-2 rounded-md border border-dashed border-gray-300 bg-gray-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          <h6 className="font-medium text-gray-900">{activity.title}</h6>
          <p className="text-sm text-gray-500">{formatTime(activity.duration)}</p>
        </div>

        {!activity.isClassified && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
            Unclassified
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Toggle
          pressed={activity.isProductive}
          onPressedChange={() => handleActivityClassification(true)}
          className={cn(
            "data-[state=on]:border-green-200 data-[state=on]:bg-green-100 data-[state=on]:text-green-800",
            "h-8 border px-2"
          )}
          aria-label="Mark activity as productive"
        >
          <CheckCircle className="mr-1 h-4 w-4" />
          Productive
        </Toggle>

        <Toggle
          pressed={activity.isClassified && !activity.isProductive}
          onPressedChange={() => handleActivityClassification(false)}
          className={cn(
            "data-[state=on]:border-red-200 data-[state=on]:bg-red-100 data-[state=on]:text-red-800",
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

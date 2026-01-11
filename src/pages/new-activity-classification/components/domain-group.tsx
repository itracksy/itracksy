import { useState } from "react";
import { ThumbsUp, ThumbsDown, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Activity, ActivityRule } from "@/types/activity";
import { OnClassify } from "@/types/classify";
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

  // Handle domain-level classification
  const handleDomainClassification = (isProductive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onClassify({ ruleId: rule?.id ?? null, appName, domain, activityId: null, isProductive });
  };

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-3 p-3 pl-6 hover:bg-gray-100 dark:hover:bg-gray-700/50"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand Icon */}
        <div className="text-gray-400 dark:text-gray-500">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        {/* Domain Icon */}
        <div
          className={cn(
            "rounded-lg p-1.5",
            rule?.rating === 1
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : rule?.rating === 0
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
        </div>

        {/* Domain Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {domain || "No Domain"}
            </span>
            {rule && <RulesBadge isProductive={rule.rating === 1} />}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(totalDomainTime)}</span>
            <span>·</span>
            <span>
              {activities.length} {activities.length === 1 ? "page" : "pages"}
            </span>
          </div>
        </div>

        {/* Classification Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => handleDomainClassification(true, e)}
            className={cn(
              "h-7 px-2 text-xs",
              rule?.rating === 1
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "text-gray-500 hover:bg-green-50 hover:text-green-600 dark:text-gray-400"
            )}
          >
            <ThumbsUp className="mr-1 h-3 w-3" />
            Productive
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => handleDomainClassification(false, e)}
            className={cn(
              "h-7 px-2 text-xs",
              rule?.rating === 0
                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                : "text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400"
            )}
          >
            <ThumbsDown className="mr-1 h-3 w-3" />
            Distracting
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y border-t bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
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

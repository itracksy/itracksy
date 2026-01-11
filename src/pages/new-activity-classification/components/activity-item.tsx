import { Settings, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Activity } from "@/types/activity";

interface ActivityItemProps {
  ruleRating: number | null;
  activity: Activity;
  onUpsertRule: (ruleId: string | null) => void;
}

export function ActivityItem({ ruleRating, activity, onUpsertRule }: ActivityItemProps) {
  const isClassified = activity.rating !== null;
  const isProductive = activity.rating === 1;
  const isDistracted = activity.rating === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 pl-12",
        !isClassified && "bg-amber-50/50 dark:bg-amber-950/10"
      )}
    >
      {/* Activity Icon */}
      <div
        className={cn(
          "rounded p-1.5",
          isProductive
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : isDistracted
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        )}
      >
        <FileText className="h-3 w-3" />
      </div>

      {/* Activity Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-700 dark:text-gray-300">{activity.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(activity.duration)}</p>
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-2">
        {!isClassified && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Unclassified
          </span>
        )}

        {activity.activityRuleId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => onUpsertRule(activity.activityRuleId ?? null)}
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Settings className="h-3 w-3" />
                  Edit Rule
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit the rule that classified this activity</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!activity.activityRuleId && ruleRating !== null && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => onUpsertRule(null)}
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 px-2 text-xs",
                    ruleRating === 0
                      ? "text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400"
                      : "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400"
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  {ruleRating === 0 ? "Add Exception" : "Add Exception"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {ruleRating === 0
                    ? "Mark this specific activity as productive"
                    : "Mark this specific activity as distracting"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

import { CheckCircle, Settings, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Activity } from "@/types/activity";

interface ActivityItemProps {
  ruleRating: number | null;

  activity: Activity;

  onUpsertRule: (ruleId: string | null) => void;
}

export function ActivityItem({
  ruleRating,

  activity,

  onUpsertRule,
}: ActivityItemProps) {
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

      <div className="flex flex-col items-center">
        {activity.activityRuleId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onUpsertRule(activity.activityRuleId ?? null);
                  }}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span
                    className={
                      activity.rating === 1
                        ? "text-green-500 dark:text-green-400"
                        : activity.rating === 0
                          ? "text-red-500 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                    }
                  >
                    Edit Rule
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View or edit the rule that classified this activity</p>
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
                  onClick={() => {
                    onUpsertRule(null);
                  }}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span
                    className={
                      ruleRating === 0
                        ? "text-green-500 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    }
                  >
                    {ruleRating === 0 ? "Not distracting?" : "Not productive?"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {ruleRating === 0
                    ? "Is it not distracting? Set specific rule for this activity"
                    : "Create custom rule for this activity"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

import { CheckCircle, Settings, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Activity } from "@/types/activity";
import { OnClassify } from "@/types/classify";

interface ActivityItemProps {
  sessionId: string;
  appName: string;
  domain: string | null;
  activity: Activity;
  onClassify: OnClassify;
}

export function ActivityItem({
  sessionId,
  appName,
  domain,
  activity,
  onClassify,
}: ActivityItemProps) {
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

  // Function to open rule dialog with pre-filled values
  const handleCreateRule = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    const parentComponent = document.querySelector("[data-activitygroup]");
    if (!parentComponent) return;

    const event = new CustomEvent("openRuleDialog", {
      detail: {
        prefillValues: {
          name: `Rule for "${activity.title.substring(0, 30)}${
            activity.title.length > 30 ? "..." : ""
          }"`,
          description: "",
          active: true,
          rating: 0,
          appName,
          domain: domain || "",
          title: activity.title,
          titleCondition: "contains",
        },
      },
      bubbles: true,
    });

    parentComponent.dispatchEvent(event);
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

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
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
            pressed={activity.rating === 0}
            onPressedChange={() => handleActivityClassification(false)}
            className={cn(
              activity.rating === 0
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateRule}
                className="h-8 w-8 rounded-full"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Create rule for this activity</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create rule for "{activity.title}"</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

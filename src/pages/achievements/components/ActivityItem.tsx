import { Activity } from "@/types/activity";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDuration } from "@/utils/formatTime";

interface ActivityItemProps {
  activity: Activity;
  handleRateActivity: (activity: Activity, rating: number) => void;
  isPending: boolean;
}

export function ActivityItem({ activity, handleRateActivity, isPending }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/30 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">{activity.title}</p>
        <p className="text-muted-foreground">{formatDuration(activity.duration)}</p>
        {activity.url && <p className="truncate text-xs text-muted-foreground">{activity.url}</p>}
      </div>
      <div className="flex items-center gap-2">
        {/* Rating indicator */}
        {activity.rating !== null && (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              activity.rating === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {activity.rating === 1 ? "Productive" : "Distracting"}
          </span>
        )}

        {/* Rating and create rule buttons */}
        <div className="flex gap-1">
          <Button
            variant={activity.rating === 1 ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleRateActivity(activity, 1)}
            disabled={isPending}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant={activity.rating === 0 ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleRateActivity(activity, 0)}
            disabled={isPending}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TimeEntry, getActivitiesForTimeEntry } from "@/api/services/timeEntry";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatDuration } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";

interface TimeEntryListProps {
  timeEntries: (TimeEntry & { item?: { title: string } | null })[];
}

export function TimeEntryList({ timeEntries }: TimeEntryListProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={setExpandedItems}
        className="w-full"
      >
        {timeEntries.map((entry) => (
          <AccordionItem key={entry.id} value={entry.id} className="rounded-lg border px-4">
            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <h3 className="font-medium">{entry.item?.title || "Untitled Item"}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(entry.startTime)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {entry.duration ? formatDuration(entry.duration) : "In Progress"}
                </span>
                <AccordionTrigger className="py-0">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </AccordionTrigger>
              </div>
            </div>
            <AccordionContent>
              <div className="border-t py-4">
                <p className="text-sm text-muted-foreground">
                  {entry.description || "No description provided"}
                </p>
                <TimeEntryActivities timeEntryId={entry.id} />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function TimeEntryActivities({ timeEntryId }: { timeEntryId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", timeEntryId],
    queryFn: () => trpcClient.timeEntry.getActivitiesForTimeEntry.query(timeEntryId),
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">No activities recorded</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Activities</h4>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.timestamp} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-muted-foreground">
                {activity.ownerName} • {formatDuration(activity.duration)}
              </p>
            </div>
            <span className="text-muted-foreground">{formatDate(activity.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

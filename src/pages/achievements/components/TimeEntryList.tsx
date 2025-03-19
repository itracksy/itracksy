import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/api/services/timeEntry";
import { Eye, ThumbsUp, ThumbsDown, ChevronDown, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { formatDate, formatDuration } from "@/utils/formatTime";
import { Activity } from "@/types/activity";

import { toast } from "@/hooks/use-toast";
import { RuleDialog, RuleFormValues } from "@/components/rules/rule-dialog";
import { useCreateRule } from "@/hooks/use-create-rule";
import { ActivityItem } from "./ActivityItem";
import { TimeEntryActivities } from "./TimeEntryActivities";
import { getTitleTimeEntry } from "@/api/db/timeEntryExt";
import { TimeEntryWithRelations } from "@/types/projects";

interface TimeEntryListProps {
  timeEntries: TimeEntryWithRelations[];
}

export function TimeEntryList({ timeEntries }: TimeEntryListProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Handle item expansion with auto-collapse of others
  const handleItemChange = (value: string[]) => {
    // If we're expanding an item (value has one item that wasn't in expandedItems)
    if (value.length > expandedItems.length) {
      const newItem = value.find((item) => !expandedItems.includes(item));
      if (newItem) {
        // Only keep the newly expanded item open
        setExpandedItems([newItem]);
        setFocusedItemId(newItem);
      }
    } else if (value.length === 0) {
      // All items closed
      setExpandedItems([]);
      setFocusedItemId(null);
    } else {
      // Normal case (closing an item)
      setExpandedItems(value);
      setFocusedItemId(value[0] || null);
    }
  };

  // Handle clicking on an entry item
  const handleItemClick = (entryId: string) => {
    // If the item is already expanded, collapse it
    if (expandedItems.includes(entryId)) {
      setExpandedItems([]);
      setFocusedItemId(null);
    } else {
      // Otherwise expand this item and collapse others
      setExpandedItems([entryId]);
      setFocusedItemId(entryId);
    }
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        value={expandedItems}
        onValueChange={handleItemChange}
        className="w-full"
      >
        {timeEntries.map((entry) => {
          const isExpanded = expandedItems.includes(entry.id);
          const isFocused = focusedItemId === entry.id;

          return (
            <AccordionItem
              key={entry.id}
              value={entry.id}
              className={`group rounded-lg px-4 transition-all duration-200 hover:cursor-pointer hover:bg-primary/10 ${
                isExpanded ? "bg-primary/5 shadow-sm" : isFocused ? "bg-muted/40" : "bg-muted/20"
              }`}
            >
              <div
                className="flex items-center justify-between py-4"
                onClick={(e) => {
                  handleItemClick(entry.id);
                }}
              >
                <div className="space-y-1">
                  <h3
                    className={`font-medium group-hover:text-primary ${isFocused ? "text-primary" : ""}`}
                  >
                    {getTitleTimeEntry(entry)}
                  </h3>
                  <p className="text-sm text-muted-foreground">{formatDate(entry.startTime)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {entry.duration ? formatDuration(entry.duration) : "In Progress"}
                  </span>
                  <AccordionTrigger className="py-0" data-accordion-trigger="true">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`group-hover:text-primary ${isFocused ? "text-primary" : ""}`}
                    >
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
          );
        })}
      </Accordion>
    </div>
  );
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (e) {
    return url;
  }
}

// Helper function to group activities
function groupActivities(activities: Activity[]) {
  const appGroups: Record<
    string,
    {
      appName: string;
      totalDuration: number;
      domains: Record<
        string,
        {
          domain: string;
          activities: Activity[];
          totalDuration: number;
        }
      >;
      activitiesWithoutUrl: Activity[];
    }
  > = {};

  activities.forEach((activity) => {
    const appName = activity.ownerName;

    // Initialize app group if it doesn't exist
    if (!appGroups[appName]) {
      appGroups[appName] = {
        appName,
        totalDuration: 0,
        domains: {},
        activitiesWithoutUrl: [],
      };
    }

    appGroups[appName].totalDuration += activity.duration;

    if (activity.url) {
      const domain = extractDomain(activity.url);

      // Initialize domain group if it doesn't exist
      if (!appGroups[appName].domains[domain]) {
        appGroups[appName].domains[domain] = {
          domain,
          activities: [],
          totalDuration: 0,
        };
      }

      appGroups[appName].domains[domain].activities.push(activity);
      appGroups[appName].domains[domain].totalDuration += activity.duration;
    } else {
      appGroups[appName].activitiesWithoutUrl.push(activity);
    }
  });

  return appGroups;
}

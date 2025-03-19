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

interface TimeEntryListProps {
  timeEntries: (TimeEntry & { item?: { title: string } | null })[];
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
                    {entry.item?.title || "Untitled Item"}
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

function TimeEntryActivities({ timeEntryId }: { timeEntryId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", timeEntryId],
    queryFn: () => trpcClient.timeEntry.getActivitiesForTimeEntry.query(timeEntryId),
    enabled: true,
  });

  const queryClient = useQueryClient();

  // Track expanded app and domain groups
  const [expandedApps, setExpandedApps] = useState<string[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);

  // Rule dialog state
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [ruleDefaults, setRuleDefaults] = useState<RuleFormValues | undefined>();

  // Mutation for setting activity rating
  const ratingMutation = useMutation({
    mutationFn: ({ timestamp, rating }: { timestamp: number; rating: number }) =>
      trpcClient.activity.setActivityRating.mutate({ timestamp, rating }),
    onSuccess: (data) => {
      console.log("ratingMutation", data);
      if (data.rating === 0) {
        createRuleFromActivity(data);
      }
      queryClient.invalidateQueries({ queryKey: ["activities", timeEntryId] });
    },
  });

  // Mutation for creating rules
  const createRuleMutation = useCreateRule({
    onSuccess: (values) => {
      setIsRuleDialogOpen(false);
      toast({
        title: "Rule created",
        description: "Your productivity rule has been created successfully",
      });
    },
    timeEntryId,
    activities,
  });

  // Function to open rule dialog for an app
  const openAppRuleDialog = (appName: string) => {
    setRuleDefaults({
      name: `Block ${appName}`,
      description: `Block the application: ${appName}`,
      ruleType: "app_name",
      condition: "=",
      value: appName,
      rating: 0, // Distracting by default for blocking
      active: true,
    });
    setIsRuleDialogOpen(true);
  };

  // Function to open rule dialog for a domain
  const openDomainRuleDialog = (appName: string, domain: string) => {
    setRuleDefaults({
      name: `Block ${domain}`,
      description: `Block the domain: ${domain}`,
      ruleType: "domain",
      appName: appName,
      condition: "=",
      value: domain,
      rating: 0, // Distracting by default for blocking
      active: true,
    });
    setIsRuleDialogOpen(true);
  };

  // Function to handle rule submission
  const handleRuleSubmit = (values: RuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  // Function to handle dialog close
  const handleRuleDialogClose = (open: boolean) => {
    if (!open) {
      setIsRuleDialogOpen(false);
      setRuleDefaults(undefined);
    }
  };

  // Function to rate an activity
  const handleRateActivity = (activity: Activity, rating: number) => {
    ratingMutation.mutate({ timestamp: activity.timestamp, rating });
  };

  // Function to create rule from activity
  const createRuleFromActivity = (activity: Activity) => {
    const value = activity.url || activity.title || activity.ownerName;
    const ruleType = activity.url ? "url" : "title";
    console.log("createRuleFromActivity", activity);
    setRuleDefaults({
      name: `Rule for ${activity.ownerName}`,
      description: `Created from activity: ${activity.title}`,
      ruleType: ruleType,
      condition: "contains",
      value: value,
      rating: activity.rating ?? 0,
      active: true,
      appName: activity.ownerName,
      domain: activity.url ? extractDomain(activity.url) : undefined,
    });
    setIsRuleDialogOpen(true);
  };

  // Toggle expansion for app groups
  const toggleAppExpansion = (appName: string) => {
    setExpandedApps((prev) =>
      prev.includes(appName) ? prev.filter((name) => name !== appName) : [...prev, appName]
    );
  };

  // Toggle expansion for domain groups
  const toggleDomainExpansion = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId) ? prev.filter((id) => id !== domainId) : [...prev, domainId]
    );
  };

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

  // Group activities by app and domain
  const groupedActivities = groupActivities(activities);

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Activities</h4>
      <div className="space-y-2">
        {Object.values(groupedActivities).map((appGroup) => (
          <div key={appGroup.appName} className="rounded-md bg-muted/20">
            {/* App Group Header */}
            <div className="flex items-center justify-between rounded-t-md bg-muted/40 p-3">
              <div
                className="flex cursor-pointer items-center gap-2"
                onClick={() => toggleAppExpansion(appGroup.appName)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedApps.includes(appGroup.appName) ? "rotate-180 transform" : ""
                  }`}
                />
                <span className="font-medium">{appGroup.appName}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatDuration(appGroup.totalDuration)})
                </span>
              </div>

              {/* App level rule button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAppRuleDialog(appGroup.appName);
                }}
              >
                <Shield className="h-3 w-3" />
                <span>Block App</span>
              </Button>
            </div>

            {/* App Group Content */}
            {expandedApps.includes(appGroup.appName) && (
              <div className="space-y-2 p-2">
                {/* Activities without URL */}
                {appGroup.activitiesWithoutUrl.length > 0 && (
                  <div className="space-y-2 pl-4">
                    {appGroup.activitiesWithoutUrl.map((activity) => (
                      <ActivityItem
                        key={activity.timestamp}
                        activity={activity}
                        handleRateActivity={handleRateActivity}
                        isPending={ratingMutation.isPending}
                      />
                    ))}
                  </div>
                )}

                {/* Domain Groups */}
                {Object.values(appGroup.domains).map((domainGroup) => {
                  const domainId = `${appGroup.appName}-${domainGroup.domain}`;

                  return (
                    <div key={domainId} className="rounded-md bg-muted/10">
                      {/* Domain Group Header */}
                      <div className="flex items-center justify-between bg-muted/30 p-2 pl-6">
                        <div
                          className="flex cursor-pointer items-center gap-2"
                          onClick={() => toggleDomainExpansion(domainId)}
                        >
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              expandedDomains.includes(domainId) ? "rotate-180 transform" : ""
                            }`}
                          />
                          <span className="text-sm font-medium">{domainGroup.domain}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatDuration(domainGroup.totalDuration)})
                          </span>
                        </div>

                        {/* Domain level rule button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDomainRuleDialog(appGroup.appName, domainGroup.domain);
                          }}
                        >
                          <Shield className="h-3 w-3" />
                          <span>Block Domain</span>
                        </Button>
                      </div>

                      {/* Domain Group Content */}
                      {expandedDomains.includes(domainId) && (
                        <div className="space-y-2 p-2 pl-8">
                          {domainGroup.activities.map((activity) => (
                            <ActivityItem
                              key={activity.timestamp}
                              activity={activity}
                              handleRateActivity={handleRateActivity}
                              isPending={ratingMutation.isPending}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rule Dialog */}
      <RuleDialog
        open={isRuleDialogOpen}
        onOpenChange={handleRuleDialogClose}
        onSubmit={handleRuleSubmit}
        defaultValues={ruleDefaults}
        isSubmitting={createRuleMutation.isPending}
        mode="create"
      />
    </div>
  );
}

// Extract Activity Item as a separate component for clarity
function ActivityItem({
  activity,
  handleRateActivity,
  isPending,
}: {
  activity: Activity;
  handleRateActivity: (activity: Activity, rating: number) => void;
  isPending: boolean;
}) {
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

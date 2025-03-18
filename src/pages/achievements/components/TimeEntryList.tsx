import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/api/services/timeEntry";
import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { formatDate, formatDuration } from "@/utils/formatTime";
import { Activity } from "@/types/activity";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateRuleParams } from "@/api/services/activityRules";
import { toast } from "@/hooks/use-toast";

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

  const queryClient = useQueryClient();

  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [ruleSuggestion, setRuleSuggestion] = useState<CreateRuleParams | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    name: "",
    description: "",
  });

  // Mutation for setting activity rating
  const ratingMutation = useMutation({
    mutationFn: ({ timestamp, rating }: { timestamp: number; rating: number }) =>
      trpcClient.activity.setActivityRatingWithSuggestions.mutate({ timestamp, rating }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities", timeEntryId] });

      // If the user marked the activity as bad (rating=0), show the rule dialog
      if (data.activity && data.activity.rating === 0 && data.suggestions.length > 0) {
        setSelectedActivity(data.activity);

        // Get the best suggestion
        const bestSuggestion =
          data.suggestions.find((s) => s.ruleType === "domain") ||
          data.suggestions.find((s) => s.ruleType === "app_name") ||
          data.suggestions[0];

        setRuleSuggestion(bestSuggestion);
        setRuleFormData({
          name: bestSuggestion.name,
          description: bestSuggestion.description || "",
        });
        setShowRuleDialog(true);
      }
    },
  });

  // Mutation for creating a rule from an activity
  const createRuleMutation = useMutation({
    mutationFn: ({
      timestamp,
      rating,
      ruleName,
      ruleDescription,
    }: {
      timestamp: number;
      rating: number;
      ruleName?: string;
      ruleDescription?: string;
    }) =>
      trpcClient.activity.createRuleFromActivity.mutate({
        timestamp,
        rating,
        ruleName,
        ruleDescription,
      }),
    onSuccess: () => {
      toast({
        title: "Rule created",
        description: "The rule has been created and will be applied to future activities.",
      });
      setShowRuleDialog(false);
    },
  });

  // Function to rate an activity
  const handleRateActivity = (activity: Activity, rating: number) => {
    ratingMutation.mutate({ timestamp: activity.timestamp, rating });
  };

  // Function to create a rule from the dialog
  const handleCreateRule = () => {
    if (!selectedActivity) return;

    createRuleMutation.mutate({
      timestamp: selectedActivity.timestamp,
      rating: 0, // Bad activities get rules
      ruleName: ruleFormData.name,
      ruleDescription: ruleFormData.description,
    });
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

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Activities</h4>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.timestamp}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-muted-foreground">
                {activity.ownerName} • {formatDuration(activity.duration)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Rating indicator */}
              {activity.rating !== null && (
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    activity.rating === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {activity.rating === 1 ? "Productive" : "Distracting"}
                </span>
              )}

              {/* Rating buttons */}
              <div className="flex gap-1">
                <Button
                  variant={activity.rating === 1 ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRateActivity(activity, 1)}
                  disabled={ratingMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={activity.rating === 0 ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRateActivity(activity, 0)}
                  disabled={ratingMutation.isPending}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rule creation dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Rule for Distracting Activity</DialogTitle>
            <DialogDescription>
              Create a rule to automatically classify similar activities as distracting in the
              future.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedActivity && (
              <div className="mb-4 rounded-md bg-muted p-3">
                <p className="font-medium">{selectedActivity.title}</p>
                <p className="text-sm text-muted-foreground">{selectedActivity.ownerName}</p>
                {selectedActivity.url && (
                  <p className="truncate text-xs text-muted-foreground">{selectedActivity.url}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Rule Name
              </Label>
              <Input
                id="rule-name"
                value={ruleFormData.name}
                onChange={(e) => setRuleFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-description" className="text-right">
                Description
              </Label>
              <Input
                id="rule-description"
                value={ruleFormData.description}
                onChange={(e) =>
                  setRuleFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
              {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

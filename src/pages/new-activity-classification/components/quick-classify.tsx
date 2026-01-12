import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, Globe, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpcClient } from "@/utils/trpc";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UnclassifiedItem {
  type: "app" | "domain";
  name: string;
  appName?: string;
  duration: number;
  activityCount: number;
}

export function QuickClassify() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch unclassified activities (ratingFilter -1 = unrated)
  const { data: unclassifiedActivities = [], isLoading } = useQuery({
    queryKey: ["unclassifiedActivities"],
    queryFn: async () => {
      return trpcClient.activity.getUserActivities.query({
        ratingFilter: -1,
        limit: 500,
      });
    },
  });

  // Process activities into grouped items
  const unclassifiedItems = (() => {
    const appMap = new Map<string, { duration: number; count: number }>();
    const domainMap = new Map<string, { duration: number; count: number; appName: string }>();

    for (const activity of unclassifiedActivities) {
      const appName = activity.ownerName;
      const domain = activity.url ? extractDomain(activity.url) : null;

      if (domain) {
        const key = domain;
        const existing = domainMap.get(key) || { duration: 0, count: 0, appName };
        domainMap.set(key, {
          duration: existing.duration + activity.duration,
          count: existing.count + 1,
          appName,
        });
      } else {
        const existing = appMap.get(appName) || { duration: 0, count: 0 };
        appMap.set(appName, {
          duration: existing.duration + activity.duration,
          count: existing.count + 1,
        });
      }
    }

    const items: UnclassifiedItem[] = [];

    for (const [name, data] of appMap) {
      items.push({
        type: "app",
        name,
        duration: data.duration,
        activityCount: data.count,
      });
    }

    for (const [name, data] of domainMap) {
      items.push({
        type: "domain",
        name,
        appName: data.appName,
        duration: data.duration,
        activityCount: data.count,
      });
    }

    return items.sort((a, b) => b.duration - a.duration);
  })();

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (params: { item: UnclassifiedItem; isProductive: boolean }) => {
      console.log(
        "[QuickClassify] Creating rule for:",
        params.item.name,
        "isProductive:",
        params.isProductive
      );
      // Create the rule
      const rule = await trpcClient.activity.createRule.mutate({
        name: `Rule for ${params.item.name}`,
        description: `Created from quick classification`,
        appName: params.item.type === "app" ? params.item.name : params.item.appName || "",
        domain: params.item.type === "domain" ? params.item.name : "",
        rating: params.isProductive ? 1 : 0,
        active: true,
      });

      // Apply the new rule to existing unrated activities
      console.log("[QuickClassify] Applying rule to existing activities...");
      await trpcClient.activity.rateUnratedActivities.mutate();

      return rule;
    },
    onSuccess: (_, variables) => {
      console.log(
        "[QuickClassify] Rule created and applied successfully for:",
        variables.item.name
      );
      toast({
        title: "Classified",
        description: `${variables.item.name} marked as ${variables.isProductive ? "productive" : "distracting"}`,
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["unclassifiedActivities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["productivityStats"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntry.getTimeEntriesByTimeRange"] });
    },
    onError: (error, variables) => {
      console.error("[QuickClassify] Failed to create rule:", error);
      toast({
        title: "Error",
        description: `Failed to classify ${variables.item.name}: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleClassify = (item: UnclassifiedItem, isProductive: boolean) => {
    createRuleMutation.mutate({ item, isProductive });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (unclassifiedItems.length === 0) {
    return (
      <Card className="border-dashed border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
        <CardContent className="flex items-center justify-center gap-3 p-6">
          <Sparkles className="h-5 w-5 text-green-500" />
          <p className="text-green-700 dark:text-green-400">
            All activities are classified! Great job keeping your productivity organized.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Classify</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unclassifiedItems.length} unclassified{" "}
            {unclassifiedItems.length === 1 ? "item" : "items"} to review
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {unclassifiedItems.slice(0, 9).map((item) => (
          <Card
            key={`${item.type}-${item.name}`}
            className="group overflow-hidden border border-gray-200 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    item.type === "app"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  )}
                >
                  {item.type === "app" ? (
                    <Monitor className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(item.duration)} · {item.activityCount}{" "}
                    {item.activityCount === 1 ? "activity" : "activities"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClassify(item, true)}
                  disabled={createRuleMutation.isPending}
                  className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                >
                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                  Productive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClassify(item, false)}
                  disabled={createRuleMutation.isPending}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                  Distracting
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unclassifiedItems.length > 9 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          +{unclassifiedItems.length - 9} more items in session history below
        </p>
      )}
    </div>
  );
}

function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

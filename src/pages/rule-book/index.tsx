import { useState, useEffect } from "react";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityRule } from "@/types/activity";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Globe,
  Monitor,
  Target,
  AlertTriangle,
  BookOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RuleDialog } from "@/components/rules/rule-dialog";
import { useCreateRule } from "@/hooks/use-create-rule";
import { useUpdateRule } from "@/hooks/use-update-rule";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { RuleFormValues } from "@/types/rule";
import { cn } from "@/lib/utils";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { RuleBookRoute } from "@/routes/routes";

type FilterType = "all" | "productive" | "distracting";

export default function RuleBookPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ActivityRule | null>(null);
  const [prefillValues, setPrefillValues] = useState<Partial<RuleFormValues> | null>(null);

  // Sorting and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Get search params from TanStack Router
  const searchParams = useSearch({ from: RuleBookRoute.id });
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["activityRules"],
    queryFn: () => trpcClient.activity.getUserRules.query(),
  });

  const { confirm } = useConfirmationDialog();
  const createMutation = useCreateRule({
    activities: null,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      toast({
        title: "Rule created",
        description: "Your productivity rule has been created successfully",
      });
      setIsDialogOpen(false);
      setPrefillValues(null);
    },
  });

  const updateMutation = useUpdateRule({
    activities: null,
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingRule(null);
      setPrefillValues(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trpcClient.activity.deleteRule.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      toast({
        title: "Rule deleted",
        description: "Your productivity rule has been deleted",
      });
    },
  });

  // Handle search params from TanStack Router
  useEffect(() => {
    const { editRuleId, createRule, appName, domain, title, titleCondition, rating } = searchParams;

    // Handle editing existing rule by ID
    if (editRuleId && rules) {
      const ruleToEdit = rules.find((r) => r.id === editRuleId);
      if (ruleToEdit) {
        setEditingRule(ruleToEdit);
        setIsDialogOpen(true);
        // Clear search params after handling
        navigate({
          to: "/rule-book",
          search: {
            editRuleId: undefined,
            createRule: false,
            appName: undefined,
            domain: undefined,
            title: undefined,
            titleCondition: undefined,
            rating: undefined,
          },
        });
      }
    }

    // Handle creating new rule with prefilled values
    if (createRule && (appName || domain || title)) {
      const prefill: Partial<RuleFormValues> = {
        name: title ? `Rule for "${title.substring(0, 30)}${title.length > 30 ? "..." : ""}"` : "",
        description: "",
        active: true,
        rating: rating !== undefined ? rating : 0,
      };

      if (appName) prefill.appName = appName;
      if (domain) prefill.domain = domain;
      if (title) prefill.title = title;
      if (titleCondition) prefill.titleCondition = titleCondition as any;

      setPrefillValues(prefill);
      setIsDialogOpen(true);

      // Clear search params after handling
      navigate({
        to: "/rule-book",
        search: {
          editRuleId: undefined,
          createRule: false,
          appName: undefined,
          domain: undefined,
          title: undefined,
          titleCondition: undefined,
          rating: undefined,
        },
      });
    }
  }, [searchParams, rules, navigate]);

  function onSubmit(values: RuleFormValues) {
    if (editingRule) {
      updateMutation.mutate({ ...values, id: editingRule.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleEdit(rule: ActivityRule) {
    setEditingRule(rule);
    setPrefillValues(null);
    setIsDialogOpen(true);
  }

  function handleCreateNew() {
    setEditingRule(null);
    setPrefillValues(null);
    setIsDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsDialogOpen(false);
      setEditingRule(null);
      setPrefillValues(null);
    }
  }

  const getDefaultValues = (): RuleFormValues | undefined => {
    if (editingRule) {
      return {
        name: editingRule.name,
        description: editingRule.description || "",
        rating: editingRule.rating,
        active: editingRule.active,
        appName: editingRule.appName,
        domain: editingRule.domain,
        titleCondition: editingRule.titleCondition as any,
        title: editingRule.title || "",
        duration: editingRule.duration || 0,
        durationCondition: editingRule.durationCondition as any,
      };
    }

    if (prefillValues) {
      return {
        name: prefillValues.name || "",
        description: prefillValues.description || "",
        rating: prefillValues.rating !== undefined ? prefillValues.rating : 0,
        active: prefillValues.active !== undefined ? prefillValues.active : true,
        appName: prefillValues.appName || "",
        domain: prefillValues.domain || "",
        titleCondition: prefillValues.titleCondition || "contains",
        title: prefillValues.title || "",
        duration: prefillValues.duration || 0,
        durationCondition: prefillValues.durationCondition || ">",
      };
    }

    return undefined;
  };

  // Get filtered rules
  const getFilteredRules = () => {
    if (!rules) return [];

    let filteredRules = rules.filter((rule) => {
      const searchLower = searchQuery.toLowerCase();
      if (!searchLower) return true;

      return (
        rule.name.toLowerCase().includes(searchLower) ||
        (rule.description?.toLowerCase() || "").includes(searchLower) ||
        (rule.appName?.toLowerCase() || "").includes(searchLower) ||
        (rule.domain?.toLowerCase() || "").includes(searchLower) ||
        (rule.title?.toLowerCase() || "").includes(searchLower)
      );
    });

    if (filterType === "productive") {
      filteredRules = filteredRules.filter((rule) => rule.rating === 1);
    } else if (filterType === "distracting") {
      filteredRules = filteredRules.filter((rule) => rule.rating === 0);
    }

    return filteredRules;
  };

  // Group rules by app or domain
  const getGroupedRules = () => {
    const filtered = getFilteredRules();
    const groups: Record<string, { type: "app" | "domain"; rules: ActivityRule[] }> = {};

    filtered.forEach((rule) => {
      // Determine group key - use domain if it exists, otherwise use appName
      const groupKey =
        rule.domain && rule.domain.trim() !== ""
          ? rule.domain.toLowerCase()
          : (rule.appName || "Unknown").toLowerCase();

      const groupType = rule.domain && rule.domain.trim() !== "" ? "domain" : "app";

      if (!groups[groupKey]) {
        groups[groupKey] = { type: groupType, rules: [] };
      }
      groups[groupKey].rules.push(rule);
    });

    // Sort rules within each group: rules with title/duration conditions first, then by rating
    Object.values(groups).forEach((group) => {
      group.rules.sort((a, b) => {
        const aHasCondition = Boolean(
          (a.title && a.titleCondition) || (a.duration && a.durationCondition)
        );
        const bHasCondition = Boolean(
          (b.title && b.titleCondition) || (b.duration && b.durationCondition)
        );

        // Rules with conditions (exceptions) first
        if (aHasCondition && !bHasCondition) return 1;
        if (!aHasCondition && bHasCondition) return -1;

        // Then by rating (productive first for conditions, distracting first for base rules)
        if (aHasCondition) {
          // For exception rules, productive first
          if (a.rating !== b.rating) return b.rating - a.rating;
        } else {
          // For base rules, distracting first (they're the "main" rule)
          if (a.rating !== b.rating) return a.rating - b.rating;
        }

        return a.name.localeCompare(b.name);
      });
    });

    // Sort groups: apps first, then domains, alphabetically within each
    return Object.entries(groups).sort(([keyA, groupA], [keyB, groupB]) => {
      if (groupA.type !== groupB.type) {
        return groupA.type === "app" ? -1 : 1;
      }
      return keyA.localeCompare(keyB);
    });
  };

  // Calculate stats
  const productiveCount = rules?.filter((r) => r.rating === 1).length || 0;
  const distractingCount = rules?.filter((r) => r.rating === 0).length || 0;

  const groupedRules = getGroupedRules();
  const filteredRules = getFilteredRules();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rule Book</h1>
            <p className="text-sm text-muted-foreground">
              Automatically classify your activities as productive or distracting
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Stats Cards */}
      {rules && rules.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              filterType === "productive" && "ring-2 ring-primary"
            )}
            onClick={() => setFilterType(filterType === "productive" ? "all" : "productive")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productiveCount}</p>
                <p className="text-sm text-muted-foreground">Productive Rules</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              filterType === "distracting" && "ring-2 ring-destructive"
            )}
            onClick={() => setFilterType(filterType === "distracting" ? "all" : "distracting")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{distractingCount}</p>
                <p className="text-sm text-muted-foreground">Distracting Rules</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {rules && rules.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rules by name, app, or domain..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filterType !== "all" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Showing {filterType} rules</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setFilterType("all")}
              >
                Clear filter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading rules...</p>
          </div>
        </div>
      ) : rules?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No rules yet</h3>
            <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
              Create your first rule to automatically classify activities as productive or
              distracting based on the app or website.
            </p>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : filteredRules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No matching rules</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Try adjusting your search or filter
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedRules.map(([groupKey, group]) => (
            <RuleGroup
              key={groupKey}
              groupKey={groupKey}
              groupType={group.type}
              rules={group.rules}
              onEdit={handleEdit}
              onDelete={(rule) => {
                confirm({
                  title: "Delete Rule",
                  description: `Are you sure you want to delete "${rule.name}"?`,
                }).then((confirmed) => {
                  if (confirmed) {
                    deleteMutation.mutate(rule.id);
                  }
                });
              }}
            />
          ))}
        </div>
      )}

      <RuleDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={onSubmit}
        defaultValues={getDefaultValues()}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        mode={editingRule ? "edit" : "create"}
      />
    </div>
  );
}

// Rule Group Component
function RuleGroup({
  groupKey,
  groupType,
  rules,
  onEdit,
  onDelete,
}: {
  groupKey: string;
  groupType: "app" | "domain";
  rules: ActivityRule[];
  onEdit: (rule: ActivityRule) => void;
  onDelete: (rule: ActivityRule) => void;
}) {
  // Get display name with proper casing
  const displayName = rules[0]?.domain || rules[0]?.appName || groupKey;

  // Count productive and distracting rules
  const productiveCount = rules.filter((r) => r.rating === 1).length;
  const distractingCount = rules.filter((r) => r.rating === 0).length;

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <div className="flex items-center gap-3 px-1">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            groupType === "domain" ? "bg-blue-500/10" : "bg-purple-500/10"
          )}
        >
          {groupType === "domain" ? (
            <Globe className="h-4 w-4 text-blue-500" />
          ) : (
            <Monitor className="h-4 w-4 text-purple-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{displayName}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {rules.length} rule{rules.length !== 1 ? "s" : ""}
            </span>
            {productiveCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {productiveCount} productive
              </span>
            )}
            {distractingCount > 0 && (
              <span className="text-red-600 dark:text-red-400">{distractingCount} distracting</span>
            )}
          </div>
        </div>
      </div>

      {/* Rules in this group */}
      <div className="space-y-1.5 pl-11">
        {rules.map((rule) => (
          <RuleItem
            key={rule.id}
            rule={rule}
            onEdit={() => onEdit(rule)}
            onDelete={() => onDelete(rule)}
          />
        ))}
      </div>
    </div>
  );
}

// Rule Item Component (simplified for grouped view)
function RuleItem({
  rule,
  onEdit,
  onDelete,
}: {
  rule: ActivityRule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isProductive = rule.rating === 1;
  const hasCondition = Boolean(
    (rule.title && rule.titleCondition) || (rule.duration && rule.durationCondition)
  );

  // Get condition description
  const getConditionDescription = () => {
    if (rule.title && rule.titleCondition) {
      const conditionText = rule.titleCondition === "contains" ? "contains" : rule.titleCondition;
      const truncatedTitle =
        rule.title.length > 40 ? `${rule.title.substring(0, 40)}...` : rule.title;
      return `Title ${conditionText} "${truncatedTitle}"`;
    }
    if (rule.duration && rule.durationCondition) {
      return `Duration ${rule.durationCondition} ${rule.duration}s`;
    }
    return null;
  };

  const condition = getConditionDescription();

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-sm",
        isProductive ? "hover:border-emerald-500/30" : "hover:border-red-500/30",
        hasCondition && "border-l-2",
        hasCondition && isProductive && "border-l-emerald-500",
        hasCondition && !isProductive && "border-l-red-500"
      )}
    >
      <CardContent className="flex items-center gap-3 p-3">
        {/* Condition indicator */}
        {hasCondition ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded",
              isProductive ? "bg-emerald-500/10" : "bg-red-500/10"
            )}
          >
            {isProductive ? (
              <Target className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {hasCondition ? (
            <p className="truncate text-sm text-muted-foreground">{condition}</p>
          ) : (
            <p className="truncate text-sm font-medium">
              {isProductive ? "Productive" : "Distracting"} (base rule)
            </p>
          )}
        </div>

        {/* Classification Badge for exception rules */}
        {hasCondition && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              isProductive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {isProductive ? "Exception" : "Block"}
          </div>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

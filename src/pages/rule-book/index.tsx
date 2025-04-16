import { useState, useEffect } from "react";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, ActivityRule } from "@/types/activity";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Edit, Search, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RuleDialog } from "@/components/rules/rule-dialog";
import { useCreateRule } from "@/hooks/use-create-rule";
import { useUpdateRule } from "@/hooks/use-update-rule";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RuleFormValues } from "@/types/rule";

export default function RuleBookPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ActivityRule | null>(null);
  const [prefillValues, setPrefillValues] = useState<Partial<RuleFormValues> | null>(null);

  // Sorting and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof ActivityRule>("rating");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

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

  // Parse URL parameters on component mount
  useEffect(() => {
    // Check URL for prefill parameters
    const params = new URLSearchParams(window.location.search);
    const createRule = params.get("createRule");

    if (createRule === "true") {
      const appName = params.get("appName");
      const domain = params.get("domain");
      const title = params.get("title");
      const titleCondition = params.get("titleCondition");

      if (appName || domain || title) {
        // Create prefill object with available parameters
        const prefill: Partial<RuleFormValues> = {
          name: title
            ? `Rule for "${title.substring(0, 30)}${title.length > 30 ? "..." : ""}"`
            : "",
          description: "",
          active: true,
          rating: 0,
        };

        if (appName) prefill.appName = appName;
        if (domain) prefill.domain = domain;
        if (title) prefill.title = title;
        if (titleCondition) prefill.titleCondition = titleCondition as any;

        // Open the dialog with prefilled values
        setPrefillValues(prefill);
        setIsDialogOpen(true);

        // Clean URL by removing query parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

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

  // Function to handle sorting toggle for table headers
  const handleSortToggle = (field: keyof ActivityRule) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If sorting by a new field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Function to get sorted and filtered rules
  const getSortedAndFilteredRules = () => {
    if (!rules) return [];

    // Apply search filter
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

    // Apply rating filter
    if (ratingFilter !== null) {
      filteredRules = filteredRules.filter((rule) => rule.rating === ratingFilter);
    }

    // Apply sorting
    return filteredRules.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // For numbers and booleans
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="my-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Your Rules</h2>
          <p className="text-sm text-muted-foreground">
            Rules are applied automatically to categorize your activities
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Rule
        </Button>
      </div>

      {/* Search and Filter Controls */}
      {rules && rules.length > 0 && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rules..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-1">
                  <Filter className="h-4 w-4" />
                  {ratingFilter !== null ? (
                    <span>{ratingFilter === 1 ? "Productive" : "Distracting"}</span>
                  ) : (
                    <span>All ratings</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by rating</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setRatingFilter(null)}>
                  All ratings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRatingFilter(1)}>Productive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRatingFilter(0)}>Distracting</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading rules...</p>
        </div>
      ) : rules?.length === 0 ? (
        <Card className="my-6">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              You haven't created any productivity rules yet. Rules help you classify activities
              automatically.
            </p>
            <Button className="mt-4" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableCaption>Your activity classification rules</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSortToggle("name")}
                className="cursor-pointer hover:bg-muted/50"
              >
                <div className="flex items-center">
                  Rule
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSortToggle("appName")}
                className="cursor-pointer hover:bg-muted/50"
              >
                <div className="flex items-center">
                  Type
                  {sortField === "appName" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Condition</TableHead>
              <TableHead
                onClick={() => handleSortToggle("rating")}
                className="cursor-pointer hover:bg-muted/50"
              >
                <div className="flex items-center">
                  Classification
                  {sortField === "rating" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedAndFilteredRules().map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {rule.domain ? `${rule.appName}/${rule.domain}` : rule.appName}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.title && rule.titleCondition ? (
                    <span>
                      Title {rule.titleCondition} "{rule.title.substring(0, 25)}
                      {rule.title.length > 25 ? "..." : ""}"
                    </span>
                  ) : rule.duration && rule.durationCondition ? (
                    <span>
                      Duration {rule.durationCondition} {rule.duration}s
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={rule.rating === 1 ? "default" : "destructive"}
                    className="capitalize"
                  >
                    {rule.rating === 1 ? "Productive" : "Distracting"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        confirm({
                          title: "Delete Rule",
                          description: "Are you sure you want to delete this rule?",
                        }).then((confirmed) => {
                          if (confirmed) {
                            deleteMutation.mutate(rule.id);
                          }
                        });
                      }}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

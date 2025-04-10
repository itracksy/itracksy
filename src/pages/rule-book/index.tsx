import { useState } from "react";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity } from "@/types/activity";
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
import { Plus, Trash, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RuleDialog, RuleFormValues } from "@/components/rules/rule-dialog";
import { useCreateRule } from "@/hooks/use-create-rule";
import { useUpdateRule } from "@/hooks/use-update-rule";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";

export default function RuleBookPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

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
    },
  });

  const updateMutation = useUpdateRule({
    activities: null,
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingRule(null);
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

  function onSubmit(values: RuleFormValues) {
    if (editingRule) {
      updateMutation.mutate({ ...values, id: editingRule.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleEdit(rule: any) {
    setEditingRule(rule);
    setIsDialogOpen(true);
  }

  function handleCreateNew() {
    setEditingRule(null);
    setIsDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsDialogOpen(false);
      setEditingRule(null);
    }
  }

  const getDefaultValues = (): RuleFormValues | undefined => {
    if (!editingRule) return undefined;

    return {
      name: editingRule.name,
      description: editingRule.description || "",
      ruleType: editingRule.ruleType,
      condition: editingRule.condition,
      value: editingRule.value,
      rating: editingRule.rating,
      active: editingRule.active,
      appName: editingRule.appName,
      domain: editingRule.domain,
    };
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
              <TableHead>Rule</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules?.map((rule) => (
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
                  <Badge variant="outline">{rule.ruleType}</Badge>
                </TableCell>
                <TableCell>
                  {rule.condition} "{rule.value.substring(0, 25)}
                  {rule.value.length > 25 ? "..." : ""}"
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

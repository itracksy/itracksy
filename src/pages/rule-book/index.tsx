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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { Plus, Trash, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  ruleType: z.enum(["duration", "app_name", "domain", "title", "url"]),
  condition: z.enum([">", "<", "=", ">=", "<=", "contains", "startsWith", "endsWith"]),
  value: z.string().min(1),
  rating: z.number().min(0).max(1),
  active: z.boolean().default(true),
});

export default function RuleBookPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["activityRules"],
    queryFn: () => trpcClient.activity.getUserRules.query(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      ruleType: "app_name",
      condition: "=",
      value: "",
      rating: 1,
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      trpcClient.activity.createRule.mutate(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      toast({
        title: "Rule created",
        description: "Your productivity rule has been created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema> & { id: string }) => {
      const { id, ...updates } = values;
      return trpcClient.activity.updateRule.mutate({ id, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
      toast({
        title: "Rule updated",
        description: "Your productivity rule has been updated successfully",
      });
      setIsDialogOpen(false);
      setEditingRule(null);
      form.reset();
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      trpcClient.activity.toggleRuleActive.mutate({ id, active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityRules"] });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (editingRule) {
      updateMutation.mutate({ ...values, id: editingRule.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleEdit(rule: any) {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      condition: rule.condition,
      value: rule.value,
      rating: rule.rating,
      active: rule.active,
    });
    setIsDialogOpen(true);
  }

  function handleCreateNew() {
    setEditingRule(null);
    form.reset({
      name: "",
      description: "",
      ruleType: "app_name",
      condition: "=",
      value: "",
      rating: 1,
      active: true,
    });
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setEditingRule(null);
    form.reset();
  }

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
              <TableHead>Status</TableHead>
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
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: rule.id, active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(rule.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create New Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Update your activity classification rule"
                : "Create a rule to automatically classify activities"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Social Media Sites" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for your rule</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Identifies distracting websites" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ruleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a rule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="app_name">Application</SelectItem>
                          <SelectItem value="domain">Domain</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="duration">Duration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("ruleType") === "duration" ? (
                            <>
                              <SelectItem value=">">Greater than</SelectItem>
                              <SelectItem value="<">Less than</SelectItem>
                              <SelectItem value="=">Equal to</SelectItem>
                              <SelectItem value=">=">Greater than or equal</SelectItem>
                              <SelectItem value="<=">Less than or equal</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="=">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="startsWith">Starts with</SelectItem>
                              <SelectItem value="endsWith">Ends with</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          form.watch("ruleType") === "duration"
                            ? "Duration in seconds (e.g., 300 for 5 minutes)"
                            : form.watch("ruleType") === "domain"
                              ? "e.g., facebook.com"
                              : "Value to match against"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classification</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Productive</SelectItem>
                        <SelectItem value="0">Distracting</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activate Rule</FormLabel>
                      <FormDescription>Turn this rule on or off</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

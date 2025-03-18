import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";

export const ruleFormSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  ruleType: z.enum(["duration", "app_name", "domain", "title", "url"]),
  condition: z.enum([">", "<", "=", ">=", "<=", "contains", "startsWith", "endsWith"]),
  value: z.string().min(1),
  rating: z.number().min(0).max(1),
  active: z.boolean().default(true),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

type RuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RuleFormValues) => void;
  defaultValues?: RuleFormValues;
  isSubmitting: boolean;
  mode: "create" | "edit";
};

export function RuleDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting,
  mode,
}: RuleDialogProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      ruleType: "app_name",
      condition: "=",
      value: "",
      rating: 1,
      active: true,
    },
  });

  function handleSubmit(values: RuleFormValues) {
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Rule" : "Create New Rule"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update your activity classification rule"
              : "Create a rule to automatically classify activities"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === "edit" ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

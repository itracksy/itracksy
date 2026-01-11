import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Check, X, Globe, AppWindow } from "lucide-react";
import { ruleFormSchema, RuleFormValues } from "@/types/rule";
import { cn } from "@/lib/utils";

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
      rating: 0,
      active: true,
      titleCondition: "contains",
    },
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  function handleSubmit(values: RuleFormValues) {
    // Auto-generate name from pattern if not provided
    const pattern = values.domain || values.appName || values.title || "Rule";
    if (!values.name) {
      values.name = `Rule for ${pattern}`;
    }
    onSubmit(values);
  }

  // Determine if this looks like a browser (has domain) or app
  const hasDomain = !!form.watch("domain");
  const hasAppName = !!form.watch("appName");
  const isWebsite = hasDomain || (!hasAppName && mode === "create");

  // Get the display pattern for the header
  const getDisplayPattern = () => {
    if (hasDomain) return form.watch("domain");
    if (hasAppName) return form.watch("appName");
    return null;
  };

  const displayPattern = getDisplayPattern();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mode === "edit" ? "Edit Rule" : "Create Rule"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {displayPattern ? (
              <span className="flex items-center gap-2">
                {hasDomain ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <AppWindow className="h-4 w-4 text-purple-500" />
                )}
                <span className="font-medium text-foreground">{displayPattern}</span>
              </span>
            ) : (
              "Classify activities by matching patterns"
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Pattern Input */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Match Pattern</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] p-3 text-xs">
                      Enter a website domain (e.g., facebook.com) or app name (e.g., Slack).
                      Activities containing this text will be classified.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Show domain field for websites, appName for apps */}
              {isWebsite ? (
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="e.g., facebook.com, youtube.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <AppWindow className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="e.g., Slack, Discord, Figma"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Optional: Title contains for more specific matching */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        className="text-sm"
                        placeholder="Window title contains... (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classification */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-3 text-sm font-medium">Classification</div>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange(1)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          field.value === 1
                            ? "border-green-500 bg-green-500/10"
                            : "border-muted hover:border-green-500/50 hover:bg-green-500/5"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            field.value === 1
                              ? "bg-green-500 text-white"
                              : "bg-green-500/20 text-green-500"
                          )}
                        >
                          <Check className="h-5 w-5" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            field.value === 1
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          )}
                        >
                          Productive
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange(0)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          field.value === 0
                            ? "border-red-500 bg-red-500/10"
                            : "border-muted hover:border-red-500/50 hover:bg-red-500/5"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            field.value === 0
                              ? "bg-red-500 text-white"
                              : "bg-red-500/20 text-red-500"
                          )}
                        >
                          <X className="h-5 w-5" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            field.value === 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          )}
                        >
                          Distracting
                        </span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#E5A853] hover:bg-[#d09641]"
              >
                {mode === "edit" ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

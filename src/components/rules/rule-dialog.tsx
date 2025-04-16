import { useEffect } from "react";
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

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Focus, Globe, Tag } from "lucide-react";
import { ruleFormSchema, RuleFormValues } from "@/types/rule";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    },
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  function handleSubmit(values: RuleFormValues) {
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="px-4 py-3">
          <DialogTitle className="text-lg">
            {mode === "edit" ? "Edit Rule" : "Create New Rule"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "edit"
              ? "Update your activity classification rule"
              : "Create a rule to automatically classify activities"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-9rem)]">
          <div className="px-4 py-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                <Tabs defaultValue="conditions" className="w-full">
                  <TabsList className="grid h-8 w-full grid-cols-2">
                    <TabsTrigger
                      value="conditions"
                      className="flex items-center gap-1 py-1.5 text-xs"
                    >
                      <Focus className="h-3 w-3" />
                      <span>Matching Conditions</span>
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-1 py-1.5 text-xs">
                      <Tag className="h-3 w-3" />
                      <span>Rule Details</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="conditions" className="space-y-3 pt-3">
                    <Card className="overflow-hidden shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">Application Matching</CardTitle>
                        <CardDescription className="text-xs">
                          Set conditions for matching apps and websites
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-1">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="appName"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Application Name</FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-8 text-sm"
                                    placeholder="e.g., Chrome, Safari"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="domain"
                            render={({ field }) => (
                              <FormItem className="flex flex-col space-y-1">
                                <div className="flex items-center gap-1">
                                  <FormLabel className="text-xs">Domain</FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="w-40 p-2 text-[10px]">
                                        Enter a website domain like "facebook.com"
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <FormControl>
                                  <div className="flex items-center">
                                    <Globe className="mr-1 h-3 w-3 text-muted-foreground" />
                                    <Input
                                      className="h-8 text-sm"
                                      placeholder="e.g., facebook.com"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">Content Matching</CardTitle>
                        <CardDescription className="text-xs">
                          Match based on title content
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-1">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="titleCondition"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">
                                  Title Condition (Optional)
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || ""}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="startsWith">Starts with</SelectItem>
                                    <SelectItem value="endsWith">Ends with</SelectItem>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="=">Equals (=)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Title Text</FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-8 text-sm"
                                    placeholder="e.g., News Feed"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">Duration</CardTitle>
                        <CardDescription className="text-xs">
                          Match based on activity duration
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-1">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="durationCondition"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Condition (Optional)</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || ""}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value=">">Greater than</SelectItem>
                                    <SelectItem value="<">Less than</SelectItem>
                                    <SelectItem value="=">Equal to</SelectItem>
                                    <SelectItem value=">=">Greater than or equal</SelectItem>
                                    <SelectItem value="<=">Less than or equal</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs">Seconds</FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-8 text-sm"
                                    type="number"
                                    placeholder="Duration in seconds"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-3 pt-3">
                    <Card className="overflow-hidden shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-1">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs">Rule Name</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-8 text-sm"
                                  placeholder="e.g., Social Media Sites"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-8 text-sm"
                                  placeholder="e.g., Identifies websites"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">Activity Classification</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 pt-1">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs">Productivity Rating</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-2 gap-2 rounded-md border p-1">
                                  <div
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-md p-2 transition-colors ${
                                      field.value === 1
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-muted/40"
                                    }`}
                                    onClick={() => field.onChange(1)}
                                  >
                                    <div className="rounded-full border border-green-500/50 bg-green-100/50 p-1 dark:border-green-500/30 dark:bg-green-900/20">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 text-green-600 dark:text-green-400"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </div>
                                    <span className="mt-1 text-xs font-medium">Productive</span>
                                  </div>

                                  <div
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-md p-2 transition-colors ${
                                      field.value === 0
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                        : "bg-muted/40"
                                    }`}
                                    onClick={() => field.onChange(0)}
                                  >
                                    <div className="rounded-full border border-red-500/50 bg-red-100/50 p-1 dark:border-red-500/30 dark:bg-red-900/20">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3 text-red-600 dark:text-red-400"
                                      >
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                      </svg>
                                    </div>
                                    <span className="mt-1 text-xs font-medium">Distracting</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t p-3">
          <div className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 flex-1 text-xs sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
              className="h-8 flex-1 text-xs sm:flex-none"
            >
              {mode === "edit" ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

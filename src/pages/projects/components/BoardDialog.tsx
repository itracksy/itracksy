import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Archive, ArchiveRestore } from "lucide-react";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().optional(),
  currency: z.string().optional(),
  createDefaultColumns: z.boolean().default(true),
  isArchived: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  onArchive?: (archive: boolean) => void;
  initialData?: {
    name: string;
    color: string | null;
    hourlyRate: number | null;
    currency: string | null;
    deletedAt: number | null;
  };
  mode: "create" | "edit";
}

export function BoardDialog({
  open,
  onOpenChange,
  onSubmit,
  onArchive,
  initialData,
  mode,
}: BoardDialogProps) {
  const isArchived = initialData?.deletedAt !== null && initialData?.deletedAt !== undefined;
  const { confirm } = useConfirmationDialog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          color: initialData.color ?? "#e0e0e0",
          hourlyRate: initialData.hourlyRate ?? undefined,
          currency: initialData.currency ?? "USD",
          createDefaultColumns: false, // Don't create columns when editing
          isArchived: isArchived,
        }
      : {
          name: "",
          color: "#e0e0e0",
          hourlyRate: undefined,
          currency: "USD",
          createDefaultColumns: true, // Default to true for new boards
          isArchived: false,
        },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name,
        color: initialData.color || "#e0e0e0",
        hourlyRate: initialData.hourlyRate || undefined,
        currency: initialData.currency || "USD",
        createDefaultColumns: false, // Don't create columns when editing
        isArchived: isArchived,
      });
    } else if (!open) {
      form.reset();
    }
  }, [form, initialData, open, isArchived]);

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
  };

  const handleArchiveToggle = () => {
    onOpenChange(false);
    if (onArchive) {
      confirm({
        title: isArchived ? "Restore Board" : "Archive Board",
        description: isArchived
          ? "Are you sure you want to restore this board? It will be moved back to the active boards."
          : "Are you sure you want to archive this board? It will be moved to the archived boards. You can restore it later.",
        confirmText: isArchived ? "Restore" : "Archive",
        variant: "destructive",
      }).then((confirmed) => {
        if (confirmed) {
          // Call the onArchive function with the opposite of the current state
          onArchive(!isArchived);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-tracksy-gold/20 bg-background dark:border-tracksy-gold/10 dark:bg-card">
        <DialogHeader>
          <DialogTitle className="text-tracksy-blue dark:text-tracksy-gold">
            {mode === "create" ? "Create New Board" : "Edit Board Settings"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "create"
              ? "Add a new board to organize your projects."
              : "Update your board settings and preferences."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tracksy-blue dark:text-tracksy-gold">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter board name"
                      className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20 dark:border-tracksy-gold/20 dark:bg-card dark:text-foreground dark:focus:border-tracksy-gold/40 dark:focus:ring-tracksy-gold/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tracksy-blue dark:text-tracksy-gold">
                    Hourly Rate
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Optional hourly rate"
                      className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20 dark:border-tracksy-gold/20 dark:bg-card dark:text-foreground dark:focus:border-tracksy-gold/40 dark:focus:ring-tracksy-gold/30"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tracksy-blue dark:text-tracksy-gold">
                    Currency
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20 dark:border-tracksy-gold/20 dark:bg-card dark:text-foreground dark:focus:border-tracksy-gold/40 dark:focus:ring-tracksy-gold/30">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="dark:bg-card dark:text-foreground">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 dark:text-red-400" />
                </FormItem>
              )}
            />

            {mode === "create" && (
              <FormField
                control={form.control}
                name="createDefaultColumns"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-tracksy-gold/20 p-4 dark:border-tracksy-gold/10">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:border-tracksy-gold data-[state=checked]:bg-tracksy-gold dark:border-tracksy-gold/40"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-tracksy-blue dark:text-tracksy-gold">
                        Create default columns
                      </FormLabel>
                      <FormDescription className="dark:text-muted-foreground">
                        Automatically create "ToDo", "In Progress", and "Done" columns for this
                        board
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              {mode === "edit" && onArchive && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchiveToggle}
                  className={`mr-auto ${isArchived ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"} border-tracksy-gold/30 hover:bg-tracksy-gold/10 dark:border-tracksy-gold/20 dark:hover:bg-tracksy-gold/20`}
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="mr-1 h-4 w-4" />
                      Restore Board
                    </>
                  ) : (
                    <>
                      <Archive className="mr-1 h-4 w-4" />
                      Archive Board
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-tracksy-gold/30 hover:bg-tracksy-gold/10 hover:text-tracksy-blue dark:border-tracksy-gold/20 dark:hover:bg-tracksy-gold/20 dark:hover:text-tracksy-gold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-tracksy-gold text-white hover:bg-tracksy-gold/90 dark:bg-tracksy-gold/90 dark:hover:bg-tracksy-gold"
              >
                {mode === "create" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().optional(),
  currency: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  initialData?: {
    name: string;
    color: string | null;
    hourlyRate: number | null;
    currency: string | null;
  };
  mode: "create" | "edit";
}

export function BoardDialog({ open, onOpenChange, onSubmit, initialData, mode }: BoardDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "#e0e0e0",
      hourlyRate: undefined,
      currency: "USD",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-tracksy-gold/20 bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-tracksy-blue">
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
                  <FormLabel className="text-tracksy-blue">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter board name"
                      className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tracksy-blue">Hourly Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Optional hourly rate"
                      className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-tracksy-blue">Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-tracksy-gold/30 hover:bg-tracksy-gold/10 hover:text-tracksy-blue"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-tracksy-gold text-white hover:bg-tracksy-gold/90">
                {mode === "create" ? "Create" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

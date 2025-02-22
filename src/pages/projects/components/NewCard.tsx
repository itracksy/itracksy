import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateItemMutation } from "@/hooks/useBoardQueries";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  boardId: z.string(),
  columnId: z.string(),
  order: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewCard({
  columnId,
  boardId,
  nextOrder,
  onComplete,
}: {
  columnId: string;
  boardId: string;
  nextOrder: number;
  onComplete: () => void;
}) {
  const { mutate } = useCreateItemMutation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      boardId,
      columnId,
      order: nextOrder,
    },
  });

  const onSubmit = ({ title, boardId: board_id, columnId: column_id, order }: FormValues) => {
    const id = crypto.randomUUID();
    mutate({ order, id, boardId, columnId, title });

    form.reset();
    onComplete();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-b-2 border-t-2 border-transparent px-2 py-1"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            onComplete();
          }
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  autoFocus
                  placeholder="Enter a title for this card"
                  className="h-14 w-full resize-none rounded-lg px-2 py-1 text-sm text-black shadow outline-none placeholder:text-sm placeholder:text-slate-500 dark:bg-gray-700 dark:text-white dark:placeholder:text-slate-400"
                  rows={1}
                  ref={field.ref}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                    if (event.key === "Escape") {
                      onComplete();
                    }
                  }}
                  onChange={(event) => {
                    field.onChange(event);
                    const el = event.currentTarget;
                    el.style.height = el.scrollHeight + "px";
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-2 flex justify-between gap-2">
          <Button type="submit">Save Card</Button>
          <Button type="button" variant="ghost" onClick={onComplete}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

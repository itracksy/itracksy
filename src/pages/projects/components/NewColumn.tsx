import { useRef, useState } from "react";
import invariant from "tiny-invariant";
import { PlusIcon } from "@radix-ui/react-icons";
import { useCreateColumnMutation } from "@/services/hooks/useBoardQueries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewColumnProps {
  boardId: string;
  editInitially: boolean;
  onNewColumnAdded: () => void;
  order: number;
  className?: string;
}

export function NewColumn({
  boardId,
  editInitially,
  onNewColumnAdded,
  order,
  className,
}: NewColumnProps) {
  const [editing, setEditing] = useState(editInitially);
  const inputRef = useRef<HTMLInputElement>(null);
  const newColumnMutation = useCreateColumnMutation();

  return editing ? (
    <form
      className="ml-2 flex max-h-full w-80 flex-shrink-0 flex-col gap-5 overflow-hidden rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-gray-900/80"
      onSubmit={(event) => {
        event.preventDefault();
        invariant(inputRef.current, "missing input ref");

        newColumnMutation.mutate({
          board_id: boardId,
          name: inputRef.current.value,
          order,
        });

        inputRef.current.value = "";
        onNewColumnAdded();
        setEditing(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setEditing(false);
        }
      }}
    >
      <input
        autoFocus
        required
        ref={inputRef}
        type="text"
        name="columnName"
        autoComplete="off"
        placeholder="Enter column name..."
        className="border-tracksy-gold/30 dark:border-tracksy-gold/20 text-tracksy-blue placeholder:text-tracksy-blue/50 dark:placeholder:text-tracksy-gold/50 focus:border-tracksy-gold dark:focus:border-tracksy-gold/70 focus:ring-tracksy-gold/20 dark:focus:ring-tracksy-gold/10 w-full rounded-lg border bg-white px-2 py-1 font-medium dark:bg-gray-800 dark:text-white"
      />
      <div className="flex justify-between">
        <Button
          type="submit"
          className="bg-tracksy-gold hover:bg-tracksy-gold/90 dark:bg-tracksy-gold/80 dark:hover:bg-tracksy-gold/70 text-white"
        >
          Save Column
        </Button>
        <Button
          variant="ghost"
          onClick={() => setEditing(false)}
          className="text-tracksy-blue hover:bg-tracksy-gold/10 dark:hover:bg-tracksy-gold/5 dark:text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  ) : (
    <button
      onClick={() => {
        setEditing(true);
      }}
      aria-label="Add new column"
      className="border-tracksy-gold/30 dark:border-tracksy-gold/20 text-tracksy-blue hover:bg-tracksy-gold/10 dark:hover:bg-tracksy-gold/5 ml-2 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border bg-white/80 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 dark:text-white"
    >
      <PlusIcon className="h-6 w-6" />
    </button>
  );
}

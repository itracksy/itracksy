import { useRef } from "react";
import invariant from "tiny-invariant";

import { ItemMutationFields } from "@/types";
import { useCreateItemMutation } from "@/services/hooks/useBoardQueries";
import { itemSchema } from "@/db/schema";

import { Button } from "@/components/ui/button";

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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mutate } = useCreateItemMutation();

  return (
    <form
      method="post"
      className="border-b-2 border-t-2 border-transparent px-2 py-1"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const id = crypto.randomUUID();
        formData.set(ItemMutationFields.id.name, id);

        invariant(textAreaRef.current);
        textAreaRef.current.value = "";

        mutate(itemSchema.parse(Object.fromEntries(formData.entries())));
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onComplete();
        }
      }}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name={ItemMutationFields.columnId.name} value={columnId} />
      <input type="hidden" name={ItemMutationFields.order.name} value={nextOrder} />

      <textarea
        autoFocus
        required
        ref={textAreaRef}
        name={ItemMutationFields.title.name}
        placeholder="Enter a title for this card"
        className="h-14 w-full resize-none rounded-lg px-2 py-1 text-sm text-black shadow outline-none placeholder:text-sm placeholder:text-slate-500"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            invariant(buttonRef.current, "expected button ref");
            buttonRef.current.click();
          }
          if (event.key === "Escape") {
            onComplete();
          }
        }}
        onChange={(event) => {
          const el = event.currentTarget;
          el.style.height = el.scrollHeight + "px";
        }}
      />
      <div className="flex justify-between">
        <Button ref={buttonRef}>Save Card</Button>
        <Button variant="ghost" onClick={onComplete}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

import invariant from "tiny-invariant";
import { forwardRef, useState } from "react";

import { CONTENT_TYPES } from "@/types";
import { TrashIcon } from "@radix-ui/react-icons";
import { useDeleteCardMutation, useUpdateCardMutation } from "@/queries";
import { deleteItemSchema } from "@/db/schema";

interface CardProps {
  title: string;
  content: string | null;
  id: string;
  columnId: string;
  boardId: string;
  order: number;
  nextOrder: number;
  previousOrder: number;
}

export const Card = forwardRef<HTMLLIElement, CardProps>(
  ({ title, content, id, columnId, boardId, order, nextOrder, previousOrder }, ref) => {
    const [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">("none");

    const deleteCard = useDeleteCardMutation();
    const moveCard = useUpdateCardMutation();

    return (
      <li
        ref={ref}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
            event.preventDefault();
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            const midpoint = (rect.top + rect.bottom) / 2;
            setAcceptDrop(event.clientY <= midpoint ? "top" : "bottom");
          }
        }}
        onDragLeave={() => {
          setAcceptDrop("none");
        }}
        onDrop={(event) => {
          event.stopPropagation();

          const transfer = JSON.parse(event.dataTransfer.getData(CONTENT_TYPES.card) || "null");

          if (!transfer) {
            return;
          }

          invariant(transfer.id, "missing cardId");
          invariant(transfer.title, "missing title");

          const droppedOrder = acceptDrop === "top" ? previousOrder : nextOrder;
          const moveOrder = (droppedOrder + order) / 2;

          moveCard.mutate({
            order: moveOrder,
            columnId,
            boardId,
            id: transfer.id,
            title: transfer.title,
          });

          setAcceptDrop("none");
        }}
        className={
          "-mb-[2px] cursor-grab border-b-2 border-t-2 px-2 py-1 last:mb-0 active:cursor-grabbing " +
          (acceptDrop === "top"
            ? "border-b-transparent border-t-primary dark:border-t-red-300"
            : acceptDrop === "bottom"
              ? "border-b-primary border-t-transparent dark:border-b-red-300"
              : "border-b-transparent border-t-transparent")
        }
      >
        <div
          draggable
          className="relative w-full rounded-lg border border-border bg-card px-2 py-1 text-sm text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(CONTENT_TYPES.card, JSON.stringify({ id, title }));
            event.stopPropagation();
          }}
        >
          <h3 className="font-medium">{title}</h3>
          <div className="mt-2 text-muted-foreground">{content || <>&nbsp;</>}</div>
          <form
            onSubmit={(event) => {
              event.preventDefault();

              deleteCard.mutate(
                deleteItemSchema.parse({
                  id,
                  boardId,
                })
              );
            }}
          >
            <button
              aria-label="Delete card"
              className="absolute right-4 top-4 flex items-center gap-2 text-muted-foreground hover:text-destructive"
              type="submit"
            >
              <div className="text-xs opacity-50">{order}</div>
              <TrashIcon />
            </button>
          </form>
        </div>
      </li>
    );
  }
);

import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { twMerge } from "tailwind-merge";
import { flushSync } from "react-dom";
import { CONTENT_TYPES } from "@/types";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";

import {
  useDeleteColumnMutation,
  useUpdateItemMutation,
  useUpdateColumnMutation,
} from "@/hooks/useBoardQueries";
import { EditableText } from "./EditableText";
import { NewCard } from "./NewCard";
import { Card } from "./Card";

import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Item } from "@/types/projects";
import { useToast } from "@/hooks/use-toast";

interface ColumnProps {
  name: string;
  boardId: string;
  columnId: string;
  items: Array<Item>;
  nextOrder: number;
  previousOrder: number;
  order: number;
  className?: string;
}

export const Column = forwardRef<HTMLDivElement, ColumnProps>(
  ({ name, columnId, boardId, items, nextOrder, previousOrder, order, className }, ref) => {
    const [acceptCardDrop, setAcceptCardDrop] = useState(false);
    const editState = useState(false);
    const { confirm } = useConfirmationDialog();
    const { toast } = useToast();
    const [acceptColumnDrop, setAcceptColumnDrop] = useState<"none" | "left" | "right">("none");

    const [edit, setEdit] = useState(false);

    const itemRef = useCallback((node: HTMLElement | null) => {
      node?.scrollIntoView({
        block: "nearest",
      });
    }, []);

    const listRef = useRef<HTMLUListElement>(null!);

    function scrollList() {
      invariant(listRef.current);
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }

    const updateColumnMutation = useUpdateColumnMutation();
    const deleteColumnMutation = useDeleteColumnMutation();
    const updateCardMutation = useUpdateItemMutation();

    const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
    const hasItems = items.length > 0;

    const handleDelete = async () => {
      const confirmed = await confirm({
        title: "Delete Column",
        description: `Are you sure you want to delete the column "${name}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
      });

      if (!confirmed) return;

      try {
        await deleteColumnMutation.mutateAsync(columnId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete column",
        });
      }
    };

    const cardDndProps = {
      onDragOver: (event: React.DragEvent) => {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
          event.preventDefault();
          setAcceptCardDrop(true);
        }
      },
      onDragLeave: () => {
        setAcceptCardDrop(false);
      },
      onDrop: (event: React.DragEvent) => {
        const transfer = JSON.parse(event.dataTransfer.getData(CONTENT_TYPES.card) || "null");

        if (!transfer) {
          return;
        }

        invariant(transfer.id, "missing transfer.id");
        invariant(transfer.title, "missing transfer.title");

        updateCardMutation.mutate({
          order: (sortedItems[sortedItems.length - 1]?.order ?? 0) + 1,
          columnId,
          boardId,
          id: transfer.id,
          title: transfer.title,
        });

        setAcceptCardDrop(false);
      },
    };

    return (
      <div
        ref={ref}
        onDragOver={(event: React.DragEvent) => {
          if (event.dataTransfer.types.includes(CONTENT_TYPES.column)) {
            event.preventDefault();
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            const midpoint = (rect.left + rect.right) / 2;
            setAcceptColumnDrop(event.clientX <= midpoint ? "left" : "right");
          }
        }}
        onDragLeave={() => {
          setAcceptColumnDrop("none");
        }}
        onDrop={(event: React.DragEvent) => {
          const transfer = JSON.parse(event.dataTransfer.getData(CONTENT_TYPES.column) || "null");

          if (!transfer) {
            return;
          }

          invariant(transfer.id, "missing transfer.id");

          const droppedOrder = acceptColumnDrop === "left" ? previousOrder : nextOrder;
          // Calculate new order and ensure it's an integer
          const moveOrder = Math.floor((droppedOrder + order) / 2);
          console.log(
            "Moving column",
            transfer.id,
            "to order",
            moveOrder,
            "droppedOrder",
            droppedOrder,
            "order",
            order
          );

          // Update the dragged column's order
          updateColumnMutation.mutate({
            boardId,
            id: transfer.id,
            order: moveOrder,
          });

          // Update other columns if necessary to maintain proper order
          // If a column is dropped between two existing columns, we may need to adjust orders
          // to avoid collisions and ensure proper spacing
          if (moveOrder === order) {
            // Handle exact order collision - shift the target column
            updateColumnMutation.mutate({
              boardId,
              id: columnId,
              order: order + 1,
            });
          } else if (moveOrder > previousOrder && moveOrder < order) {
            // Column dropped to the left of current column
            // Current column might need to be shifted right
            updateColumnMutation.mutate({
              boardId,
              id: columnId,
              order: order + 1,
            });
          } else if (moveOrder > order && moveOrder < nextOrder) {
            // Column dropped to the right of current column
            // No need to update current column
          }

          setAcceptColumnDrop("none");
        }}
        className={twMerge(
          "-mr-[2px] flex max-h-full flex-shrink-0 cursor-grab flex-col border-l-2 border-r-2 border-l-transparent border-r-transparent px-2 last:mr-0 active:cursor-grabbing",
          acceptColumnDrop === "left"
            ? "border-l-tracksy-gold border-r-transparent dark:border-l-tracksy-gold/70"
            : acceptColumnDrop === "right"
              ? "border-l-transparent border-r-tracksy-gold dark:border-r-tracksy-gold/70"
              : ""
        )}
      >
        <div
          draggable={!editState[0]}
          onDragStart={(event: React.DragEvent) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(
              CONTENT_TYPES.column,
              JSON.stringify({ id: columnId, name })
            );
          }}
          {...(!items.length ? cardDndProps : {})}
          className={twMerge(
            "relative flex max-h-full w-80 flex-shrink-0 flex-col rounded-xl border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-gray-900/80",
            acceptCardDrop && "outline outline-2 outline-tracksy-gold dark:outline-tracksy-gold/70"
          )}
        >
          <div className="p-2" {...(items.length ? cardDndProps : {})}>
            <EditableText
              fieldName="name"
              editState={editState}
              value={
                // optimistic update
                updateColumnMutation.isPending && updateColumnMutation.variables.name
                  ? updateColumnMutation.variables.name
                  : name
              }
              inputLabel="Edit column name"
              buttonLabel={`Edit column "${name}" name`}
              inputClassName="border border-tracksy-gold/30 dark:border-tracksy-gold/20 w-full rounded-lg py-1 px-2 font-medium text-tracksy-blue dark:text-white bg-white dark:bg-gray-800 focus:border-tracksy-gold dark:focus:border-tracksy-gold/70 focus:ring-tracksy-gold/20 dark:focus:ring-tracksy-gold/10"
              buttonClassName="block rounded-lg text-left w-full border border-transparent py-1 px-2 font-medium text-tracksy-blue dark:text-white hover:bg-tracksy-gold/10 dark:hover:bg-tracksy-gold/5"
              onChange={(value) => {
                updateColumnMutation.mutate({
                  boardId,
                  id: columnId,
                  name: value,
                });
              }}
            />
          </div>

          <ul ref={listRef} className="flex-grow overflow-auto">
            {sortedItems.map((item, index, items) => (
              <Card
                ref={itemRef}
                key={item.id}
                title={item.title}
                content={item.content ?? ""}
                id={item.id}
                boardId={boardId}
                order={item.order}
                columnId={columnId}
                previousOrder={items[index - 1] ? items[index - 1].order : 0}
                nextOrder={items[index + 1] ? items[index + 1].order : item.order + 1}
              />
            ))}
          </ul>
          {edit ? (
            <NewCard
              columnId={columnId}
              boardId={boardId}
              nextOrder={items.length === 0 ? 1 : items[items.length - 1].order + 1}
              onComplete={() => setEdit(false)}
            />
          ) : (
            <div className="p-2" {...(items.length ? cardDndProps : {})}>
              <Button
                variant="ghost"
                onClick={() => {
                  flushSync(() => {
                    setEdit(true);
                  });
                  scrollList();
                }}
                className="w-full text-tracksy-blue hover:bg-tracksy-gold/10 dark:text-white dark:hover:bg-tracksy-gold/5"
              >
                <PlusIcon className="mr-2 h-4 w-4" /> Add a card
              </Button>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={hasItems ? undefined : handleDelete}
                  aria-label="Delete column"
                  className={twMerge(
                    "absolute right-4 top-4 flex items-center gap-2 transition-colors",
                    hasItems
                      ? "cursor-not-allowed text-muted-foreground dark:text-muted-foreground"
                      : "text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                  )}
                  type="button"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              {hasItems && (
                <TooltipContent>
                  <p>Cannot delete column with cards. Move or delete all cards first.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }
);

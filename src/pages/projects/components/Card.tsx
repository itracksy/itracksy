import invariant from "tiny-invariant";
import { forwardRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";

import { CONTENT_TYPES } from "@/types";
import { TrashIcon, PlayIcon, StopIcon, TimerIcon } from "@radix-ui/react-icons";
import { useDeleteCardMutation, useUpdateCardMutation } from "@/services/hooks/useBoardQueries";
import { formatDuration } from "@/utils/timeUtils";
import {
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useActiveTimeEntry,
} from "@/services/hooks/useTimeEntryQueries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
    const [totalDuration, setTotalDuration] = useState<string>("00:00:00");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const deleteCard = useDeleteCardMutation();
    const moveCard = useUpdateCardMutation();
    const createTimeEntry = useCreateTimeEntryMutation();
    const updateTimeEntry = useUpdateTimeEntryMutation();
    const { data: activeTimeEntry } = useActiveTimeEntry();

    const { data: item } = useQuery({
      ...convexQuery(api.board.getItem, { id }),
    });

    useEffect(() => {
      if (!item?.timeEntries) return;

      const total = item.timeEntries.reduce((acc, entry) => {
        const start = new Date(entry.start).getTime();
        const end = entry.end
          ? new Date(entry.end).getTime()
          : activeTimeEntry?.itemId === id
            ? new Date().getTime()
            : start;
        return acc + (end - start);
      }, 0);

      const hours = Math.floor(total / (1000 * 60 * 60));
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);

      setTotalDuration(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, [item?.timeEntries, activeTimeEntry?.itemId, id]);

    const handleStartTracking = () => {
      if (activeTimeEntry) {
        alert("Please stop the current active timer before starting a new one");
        return;
      }

      createTimeEntry.mutate({
        id: crypto.randomUUID(),
        itemId: id,
        boardId,
        start: Date.now(),
      });
    };

    const handleStopTracking = () => {
      if (!activeTimeEntry || activeTimeEntry.itemId !== id) {
        return;
      }

      updateTimeEntry.mutate({
        id: activeTimeEntry.id,
        end: Date.now(),
      });
    };

    const handleDelete = () => {
      deleteCard.mutate({
        id,
        boardId,
      });
      setShowDeleteDialog(false);
    };

    return (
      <>
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
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <TimerIcon className="h-4 w-4" />
              {activeTimeEntry?.itemId === id ? (
                <span className="font-medium text-green-500">Recording...</span>
              ) : (
                <span>{totalDuration}</span>
              )}
              <Button
                onClick={activeTimeEntry?.itemId === id ? handleStopTracking : handleStartTracking}
                disabled={activeTimeEntry ? activeTimeEntry.itemId !== id : false}
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                {activeTimeEntry?.itemId === id ? (
                  <>
                    <StopIcon className="mr-1 h-3 w-3" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-1 h-3 w-3" />
                    {activeTimeEntry ? "" : "Start"}
                  </>
                )}
              </Button>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Delete card"
              className="absolute right-4 top-4 flex items-center gap-2 text-muted-foreground hover:text-destructive"
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </li>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Card</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this card? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

import invariant from "tiny-invariant";
import { forwardRef, useState, useEffect, useMemo } from "react";

import { CONTENT_TYPES } from "@/types";
import {
  TrashIcon,
  PlayIcon,
  StopIcon,
  TimerIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { useDeleteItemMutation, useUpdateItemMutation } from "@/hooks/useBoardQueries";
import { formatDuration } from "@/utils/timeUtils";
import {
  useCreateTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useActiveTimeEntry,
  useTimeEntriesForItem,
} from "@/hooks/useTimeEntryQueries";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { ItemDetailDialog } from "./ItemDetailDialog";
import {
  formatDeadlineWithCountdown,
  getDeadlineColorClass,
  formatEstimatedTime,
} from "@/utils/dateUtils";
import { Subtask } from "@/types/projects";

import { targetMinutesAtom } from "@/context/board";
import { useAtomValue } from "jotai";

interface CardProps {
  title: string;
  content: string | null;
  id: string;
  columnId: string;
  boardId: string;
  order: number;
  nextOrder: number;
  previousOrder: number;
  dueDate?: number | null;
  estimatedMinutes?: number | null;
  subtasks?: string | null;
}

export const Card = forwardRef<HTMLLIElement, CardProps>(
  (
    {
      title,
      content,
      id,
      columnId,
      boardId,
      order,
      nextOrder,
      previousOrder,
      dueDate,
      estimatedMinutes,
      subtasks,
    },
    ref
  ) => {
    const targetMinutes = useAtomValue(targetMinutesAtom);
    const [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">("none");
    const [totalDuration, setTotalDuration] = useState<string>("00:00:00");
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    const deleteItem = useDeleteItemMutation();
    const moveItem = useUpdateItemMutation();
    const createTimeEntry = useCreateTimeEntryMutation();
    const updateTimeEntry = useUpdateTimeEntryMutation();
    const { data: activeTimeEntry } = useActiveTimeEntry();
    const { data: timeEntries = [] } = useTimeEntriesForItem(id);
    const { toast } = useToast();
    const { confirm } = useConfirmationDialog();

    // Parse subtasks
    const parsedSubtasks = useMemo<Subtask[]>(() => {
      if (!subtasks) return [];
      try {
        return JSON.parse(subtasks);
      } catch {
        return [];
      }
    }, [subtasks]);

    // Calculate subtask completion
    const subtaskProgress = useMemo(() => {
      if (parsedSubtasks.length === 0) return null;
      const completed = parsedSubtasks.filter((st) => st.completed).length;
      const total = parsedSubtasks.length;
      const percentage = Math.round((completed / total) * 100);
      return { completed, total, percentage };
    }, [parsedSubtasks]);

    useEffect(() => {
      if (!timeEntries.length) return;

      const total = timeEntries.reduce((acc, entry) => {
        const start = new Date(entry.startTime).getTime();
        const end = entry.endTime
          ? new Date(entry.endTime).getTime()
          : activeTimeEntry?.itemId === id
            ? new Date().getTime()
            : start;
        return acc + (end - start);
      }, 0);

      setTotalDuration(formatDuration(total));
    }, [timeEntries, activeTimeEntry?.itemId, id]);

    const handleStartTracking = async () => {
      if (activeTimeEntry) {
        toast({
          variant: "destructive",
          title: "Active Timer",
          description: "Please stop the current active timer before starting a new one",
        });
        return;
      }

      // Use estimated time if available, otherwise use default target minutes
      const duration = estimatedMinutes || targetMinutes;

      createTimeEntry.mutate({
        itemId: id,
        boardId,
        startTime: Date.now(),
        isFocusMode: true,
        targetDuration: duration,
      });
    };

    const handleStopTracking = () => {
      if (!activeTimeEntry || activeTimeEntry.itemId !== id) {
        return;
      }

      updateTimeEntry.mutate({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });
    };

    const handleDelete = async () => {
      const confirmed = await confirm({
        title: "Delete Card",
        description: "Are you sure you want to delete this card? This action cannot be undone.",
        confirmText: "Delete",
        variant: "destructive",
      });

      if (!confirmed) return;

      try {
        await deleteItem.mutateAsync(id);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete item",
        });
      }
    };

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
          // Ensure we get an integer value for the order
          const moveOrder = Math.floor((droppedOrder + order) / 2);

          moveItem.mutate({
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
          onClick={() => setShowDetailDialog(true)}
          className="relative w-full rounded-lg border border-border bg-card px-2 py-1 text-sm text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(CONTENT_TYPES.card, JSON.stringify({ id, title }));
            event.stopPropagation();
          }}
        >
          <h3 className="pr-6 font-medium">{title}</h3>
          <div
            className="prose prose-sm mt-2 max-h-16 overflow-hidden text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content || "&nbsp;" }}
          />

          {/* Deadline Display */}
          {dueDate && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs ${getDeadlineColorClass(dueDate)}`}
            >
              <CalendarIcon className="h-3 w-3" />
              <span className="font-medium">{formatDeadlineWithCountdown(dueDate)}</span>
            </div>
          )}

          {/* Estimated Time Display */}
          {estimatedMinutes && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              <span>Estimated: {formatEstimatedTime(estimatedMinutes)}</span>
            </div>
          )}

          {/* Subtasks Progress */}
          {subtaskProgress && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircledIcon className="h-3 w-3" />
              <span>
                {subtaskProgress.percentage}% - {subtaskProgress.completed}/{subtaskProgress.total}{" "}
                completed
              </span>
            </div>
          )}

          {/* Timer Section */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <TimerIcon className="h-4 w-4" />
            {activeTimeEntry?.itemId === id ? (
              <span className="font-medium text-green-500">Recording...</span>
            ) : (
              <span>{totalDuration}</span>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                activeTimeEntry?.itemId === id ? handleStopTracking() : handleStartTracking();
              }}
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
                  {estimatedMinutes ? `Start (${formatEstimatedTime(estimatedMinutes)})` : "Start"}
                </>
              )}
            </Button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            aria-label="Delete card"
            className="absolute right-2 top-2 flex items-center gap-2 text-muted-foreground hover:text-destructive"
            type="button"
          >
            <TrashIcon />
          </button>
        </div>

        <ItemDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          item={{
            id,
            title,
            content,
            boardId,
            columnId,
            order,
            createdAt: null,
            dueDate: dueDate ?? null,
            estimatedMinutes: estimatedMinutes ?? null,
            subtasks: subtasks ?? null,
          }}
        />
      </li>
    );
  }
);

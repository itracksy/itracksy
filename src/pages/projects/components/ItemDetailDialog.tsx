/**
 * Task Detail Dialog - Simplified
 *
 * Clean, focused task editing dialog with:
 * - Title editing
 * - Simple description
 * - Due date
 * - Estimated time (single input in minutes)
 * - Subtasks checklist
 * - Session history (collapsible)
 */

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { TrashIcon, PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { useUpdateItemMutation } from "@/hooks/useBoardQueries";
import { useDeleteTimeEntryMutation, useTimeEntriesForItem } from "@/hooks/useTimeEntryQueries";
import { formatDuration } from "@/utils/timeUtils";
import type { Item, TimeEntry, Subtask } from "@/types/projects";
import { Clock, ChevronDown, Calendar, Timer } from "lucide-react";
import { SessionReviewDialog } from "@/pages/focus/components/SessionReviewDialog";
import { nanoid } from "nanoid";

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
}

export function ItemDetailDialog({ open, onOpenChange, item }: ItemDetailDialogProps) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? "");
  const [dueDate, setDueDate] = useState<string>(
    item.dueDate ? format(new Date(item.dueDate), "yyyy-MM-dd") : ""
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    item.estimatedMinutes ? item.estimatedMinutes.toString() : ""
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    if (!item.subtasks) return [];
    try {
      return JSON.parse(item.subtasks);
    } catch {
      return [];
    }
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null);
  const [sessionReviewOpen, setSessionReviewOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const { confirm } = useConfirmationDialog();

  const { data: timeEntries = [] } = useTimeEntriesForItem(item.id);
  const updateCardMutation = useUpdateItemMutation();
  const deleteTimeEntryMutation = useDeleteTimeEntryMutation();

  // Calculate total tracked time
  const totalTrackedTime = useMemo(() => {
    return timeEntries.reduce((acc, entry) => {
      const start = new Date(entry.startTime).getTime();
      const end = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
      return acc + (end - start);
    }, 0);
  }, [timeEntries]);

  // Subtask progress
  const subtaskProgress = useMemo(() => {
    if (subtasks.length === 0) return null;
    const completed = subtasks.filter((st) => st.completed).length;
    return { completed, total: subtasks.length };
  }, [subtasks]);

  const handleSave = () => {
    const minutes = parseInt(estimatedMinutes) || null;

    updateCardMutation.mutate({
      id: item.id,
      boardId: item.boardId,
      title,
      content: content || null,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      estimatedMinutes: minutes,
      subtasks: subtasks.length > 0 ? JSON.stringify(subtasks) : null,
    });
    onOpenChange(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: nanoid(),
        title: newSubtaskTitle.trim(),
        completed: false,
        createdAt: Date.now(),
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st)));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    const confirmed = await confirm({
      title: "Delete Session",
      description: "Are you sure you want to delete this session?",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) {
      deleteTimeEntryMutation.mutate(timeEntryId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Edit Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="text-lg font-semibold"
            />

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Due Date & Estimated Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  Estimate (min)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 30"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                />
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Subtasks</Label>
                {subtaskProgress && (
                  <span className="text-xs text-muted-foreground">
                    {subtaskProgress.completed}/{subtaskProgress.total}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="group flex items-center gap-2 rounded-md p-1 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span
                      className={`flex-1 text-sm ${subtask.completed ? "text-muted-foreground line-through" : ""}`}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddSubtask} className="h-8">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sessions */}
            {timeEntries.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSessionsOpen(!sessionsOpen)}
                  className="flex w-full items-center justify-between rounded-md border p-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{timeEntries.length} sessions</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(totalTrackedTime)}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${sessionsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sessionsOpen && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                    {timeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {format(new Date(entry.startTime), "MMM d, HH:mm")}
                          </span>
                          <span>
                            {entry.endTime
                              ? formatDuration(
                                  new Date(entry.endTime).getTime() -
                                    new Date(entry.startTime).getTime()
                                )
                              : "Running..."}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setSelectedTimeEntry(entry);
                              setSessionReviewOpen(true);
                            }}
                          >
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteTimeEntry(entry.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Review Dialog */}
      {selectedTimeEntry && (
        <SessionReviewDialog
          session={{ ...selectedTimeEntry, item }}
          open={sessionReviewOpen}
          onOpenChange={setSessionReviewOpen}
        />
      )}
    </>
  );
}

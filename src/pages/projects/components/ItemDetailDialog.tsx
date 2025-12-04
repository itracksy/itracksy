import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Cross2Icon, Pencil2Icon, TrashIcon, PlusIcon, CheckIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { useUpdateItemMutation } from "@/hooks/useBoardQueries";
import { useDeleteTimeEntryMutation, useTimeEntriesForItem } from "@/hooks/useTimeEntryQueries";
import { formatDuration } from "@/utils/timeUtils";
import type { Item, TimeEntry, Subtask } from "@/types/projects";
import { History } from "lucide-react";
import { DialogDescription } from "@/components/ui/dialog";
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
  const [estimatedHours, setEstimatedHours] = useState<string>(
    item.estimatedMinutes ? Math.floor(item.estimatedMinutes / 60).toString() : ""
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    item.estimatedMinutes ? (item.estimatedMinutes % 60).toString() : ""
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
  const { confirm } = useConfirmationDialog();

  const { data: timeEntries = [] } = useTimeEntriesForItem(item.id);
  const updateCardMutation = useUpdateItemMutation();

  const deleteTimeEntryMutation = useDeleteTimeEntryMutation();

  const handleSave = () => {
    const totalMinutes = (parseInt(estimatedHours) || 0) * 60 + (parseInt(estimatedMinutes) || 0);

    updateCardMutation.mutate({
      id: item.id,
      boardId: item.boardId,
      title,
      content: content || null,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      estimatedMinutes: totalMinutes > 0 ? totalMinutes : null,
      subtasks: subtasks.length > 0 ? JSON.stringify(subtasks) : null,
    });
    // close the dialog
    onOpenChange(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: nanoid(),
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setSubtasks([...subtasks, newSubtask]);
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
      title: "Delete Time Entry",
      description: "Are you sure you want to delete this time entry? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (!confirmed) return;

    deleteTimeEntryMutation.mutate(timeEntryId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex w-full gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSave}>Save</Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[600px] space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="max-h-[200px] overflow-y-auto rounded border">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Add a description..."
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label>Estimated Time</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Hours"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Minutes"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span
                      className={
                        subtask.completed ? "flex-1 text-muted-foreground line-through" : "flex-1"
                      }
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddSubtask();
                      }
                    }}
                  />
                  <Button onClick={handleAddSubtask} size="icon">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session List</Label>
              <div className="rounded-md border">
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.startTime), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {entry.endTime
                              ? format(new Date(entry.endTime), "MMM d, yyyy HH:mm")
                              : "Running"}
                          </TableCell>
                          <TableCell>
                            {entry.endTime
                              ? formatDuration(
                                  new Date(entry.endTime).getTime() -
                                    new Date(entry.startTime).getTime()
                                )
                              : formatDuration(Date.now() - new Date(entry.startTime).getTime())}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTimeEntry(entry);
                                  setSessionReviewOpen(true);
                                }}
                                className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                              >
                                Review Session
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTimeEntry(entry.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Review Dialog */}
      {selectedTimeEntry && (
        <SessionReviewDialog
          session={{
            ...selectedTimeEntry,
            item: item,
          }}
          open={sessionReviewOpen}
          onOpenChange={setSessionReviewOpen}
        />
      )}
    </>
  );
}

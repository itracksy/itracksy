import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Cross2Icon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
import type { Item, TimeEntry } from "@/types/projects";
import { History } from "lucide-react";
import { DialogDescription } from "@/components/ui/dialog";

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
}

export function ItemDetailDialog({ open, onOpenChange, item }: ItemDetailDialogProps) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content ?? "");
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null);
  const [sessionReviewOpen, setSessionReviewOpen] = useState(false);
  const { confirm } = useConfirmationDialog();

  const { data: timeEntries = [] } = useTimeEntriesForItem(item.id);
  const updateCardMutation = useUpdateItemMutation();

  const deleteTimeEntryMutation = useDeleteTimeEntryMutation();

  const handleSave = () => {
    updateCardMutation.mutate({
      id: item.id,
      boardId: item.boardId,
      title,
      content: content || null,
    });
    // close the dialog
    onOpenChange(false);
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

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="max-h-[300px] overflow-y-auto rounded border">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Add a description..."
                />
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
        <Dialog open={sessionReviewOpen} onOpenChange={setSessionReviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {selectedTimeEntry.isFocusMode ? "Focus" : "Break"} Session Review
              </DialogTitle>
              <DialogDescription>
                {selectedTimeEntry.endTime
                  ? `Session from ${format(selectedTimeEntry.startTime, "MMM d, yyyy 'at' h:mm a")}`
                  : "Current active session"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center">
              <div className="text-lg font-medium">Session Review</div>
              <div className="text-gray-600 dark:text-gray-400">
                Duration:{" "}
                {selectedTimeEntry.endTime
                  ? formatDuration(selectedTimeEntry.endTime - selectedTimeEntry.startTime)
                  : formatDuration(Date.now() - selectedTimeEntry.startTime)}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Session activities and detailed analytics will be shown here.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

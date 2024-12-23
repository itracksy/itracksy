import { useState } from "react";
import { format } from "date-fns";
import { Cross2Icon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { useUpdateCardMutation } from "@/services/hooks/useBoardQueries";
import {
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
} from "@/services/hooks/useTimeEntryQueries";
import { formatDuration } from "@/utils/timeUtils";
import { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";

interface TimeEntry {
  id: string;
  start: number;
  end?: number | undefined;
  itemId: string;
  boardId: string;
}

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FunctionReturnType<typeof api.board.getItem>;
}

export function ItemDetailDialog({ open, onOpenChange, item }: ItemDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content || "");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);

  const updateCard = useUpdateCardMutation();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const deleteTimeEntry = useDeleteTimeEntryMutation();
  const { confirm } = useConfirmationDialog();

  const handleSave = () => {
    updateCard.mutate({
      id: item.id,
      boardId: item.boardId,
      title,
      content,
      order: item.order,
      columnId: item.columnId,
    });
    setIsEditing(false);
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    const confirmed = await confirm({
      title: "Delete Time Entry",
      description: "Are you sure you want to delete this time entry? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (!confirmed) return;

    deleteTimeEntry.mutate({
      id: entryId,
      itemId: item.id,
    });
  };

  const handleUpdateTimeEntry = (entry: TimeEntry, field: "start" | "end", value: Date) => {
    updateTimeEntry.mutate({
      id: entry.id,
      [field]: value.getTime(),
    });
    setEditingEntry(null);
  };

  const totalDuration =
    item.timeEntries?.reduce((acc, entry) => {
      const start = entry.start;
      const end = typeof entry.end === "number" ? entry.end : Date.now();
      return acc + (end - start);
    }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {isEditing ? (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              ) : (
                item.title
              )}
            </DialogTitle>
            <div className="flex gap-2 py-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(false);
                      setTitle(item.title);
                      setContent(item.content || "");
                    }}
                  >
                    <Cross2Icon />
                  </Button>
                  <Button variant="default" onClick={handleSave}>
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil2Icon />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1"
                rows={4}
              />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{content || "No description"}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Time Entries</Label>
              <p className="text-sm text-muted-foreground">
                Total: {formatDuration(totalDuration)}
              </p>
            </div>
            <div className="mt-2 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.timeEntries?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <span className="text-sm">{format(entry.start, "PPp")}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {entry.end ? format(entry.end, "PPp") : "In Progress"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDuration(
                          entry.end ? entry.end - entry.start : Date.now() - entry.start
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTimeEntry(entry.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

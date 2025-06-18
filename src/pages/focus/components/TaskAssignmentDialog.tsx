import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BoardSelector } from "@/components/tracking/BoardSelector";
import { useUpdateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { selectedBoardIdAtom, selectedItemIdAtom } from "@/context/board";
import { TimeEntryWithRelations } from "@/types/projects";
import { Tag } from "lucide-react";

interface TaskAssignmentDialogProps {
  activeTimeEntry: TimeEntryWithRelations;
  children: React.ReactNode;
}

export function TaskAssignmentDialog({ activeTimeEntry, children }: TaskAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const { toast } = useToast();

  const handleAssignTask = async () => {
    if (!selectedItemId) {
      toast({
        title: "No task selected",
        description: "Please select a task to assign to this session.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        boardId: selectedBoardId,
        itemId: selectedItemId,
      });

      toast({
        title: "Task Assigned",
        description: "Task has been successfully assigned to this session.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to assign task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {activeTimeEntry.itemId ? "Change Task Assignment" : "Assign Task to Session"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {activeTimeEntry.itemId && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <strong>Currently assigned to:</strong>{" "}
              {activeTimeEntry.item?.title || "Unknown Task"}
            </div>
          )}

          <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAssignTask} className="flex-1">
              {activeTimeEntry.itemId ? "Change Assignment" : "Assign Task"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

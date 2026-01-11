import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useCreateTimeEntryMutation,
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
} from "@/hooks/useTimeEntryQueries";
import { useToast } from "@/hooks/use-toast";
import { useConfirmationDialog } from "@/components/providers/ConfirmationDialog";
import { useAtom, useAtomValue } from "jotai";
import { selectedBoardIdAtom, selectedItemIdAtom, targetMinutesAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc";
import { BoardSelector } from "./BoardSelector";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeEntryDialog({ open, onOpenChange }: TimeEntryDialogProps) {
  const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
  const selectedBoardId = useAtomValue(selectedBoardIdAtom);
  const createTimeEntry = useCreateTimeEntryMutation();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const { data: activeTimeEntry } = useActiveTimeEntry();
  const { toast } = useToast();
  const { confirm } = useConfirmationDialog();
  const targetMinutes = useAtomValue(targetMinutesAtom);

  // Validate that the persisted selectedItemId still exists when component loads
  useEffect(() => {
    if (open && selectedItemId && selectedBoardId) {
      // Check if the saved item ID is still valid for the current board
      trpcClient.board.get
        .query(selectedBoardId)
        .then((board) => {
          if (!board) {
            setSelectedItemId(""); // Reset if the board no longer exists
            return;
          }
          const itemExists = board.items.some((item) => item.id === selectedItemId);
          if (!itemExists) {
            setSelectedItemId(""); // Reset if the item no longer exists
          }
        })
        .catch(() => {
          setSelectedItemId(""); // Reset on error
        });
    }
  }, [open, selectedBoardId, selectedItemId, setSelectedItemId]);

  const handleCreateTimeEntry = async (isFocusMode: boolean = false) => {
    if (!selectedItemId || !selectedBoardId) {
      toast({
        title: "Error",
        description: "Please select a task to track time for",
        variant: "destructive",
      });
      return;
    }

    // If there's an active timer on a different task, ask to switch
    if (activeTimeEntry && activeTimeEntry.itemId !== selectedItemId) {
      const confirmed = await confirm({
        title: "Switch Task?",
        description:
          "Another task is currently being tracked. Stop it and start tracking this one?",
        confirmText: "Switch",
        variant: "default",
      });

      if (!confirmed) return;

      // Stop the current timer
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        endTime: Date.now(),
      });
    }

    try {
      await createTimeEntry.mutateAsync({
        itemId: selectedItemId,
        boardId: selectedBoardId,
        startTime: Date.now(),
        isFocusMode: isFocusMode,
        targetDuration: targetMinutes,
      });

      toast({
        title: "Time entry started",
        description: isFocusMode
          ? "Focus mode activated. Let's get in the zone!"
          : "Time tracking started. Let's be productive!",
      });

      onOpenChange(false);
      setSelectedItemId("");
    } catch (error) {
      toast({
        title: "Failed to start time entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Time Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleCreateTimeEntry(true)} className="gap-2">
              Start
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

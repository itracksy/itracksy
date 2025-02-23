import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { useToast } from "@/hooks/use-toast";
import { useAtomValue } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc";
import { Focus } from "lucide-react";
import { BoardSelector } from "./BoardSelector";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeEntryDialog({ open, onOpenChange }: TimeEntryDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const selectedBoardId = useAtomValue(selectedBoardIdAtom);
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  const handleCreateTimeEntry = async (isFocusMode: boolean = false) => {
    if (!selectedItemId || !selectedBoardId) {
      toast({
        title: "Error",
        description: "Please select a task to track time for",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        itemId: selectedItemId,
        boardId: selectedBoardId,
        startTime: new Date().toISOString(),
        isFocusMode,
      });

      await trpcClient.user.updateActivitySettings.mutate({
        currentTaskId: selectedItemId,
        isFocusMode,
      });

      toast({
        title: "Time entry started",
        description: isFocusMode
          ? "Focus mode activated. Let's get in the zone! 🎯"
          : "Time tracking started. Let's be productive! 🚀",
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
            <Button
              variant="outline"
              onClick={() => handleCreateTimeEntry(true)}
              className="gap-2"
            >
              <Focus className="h-4 w-4" />
              Focus Mode
            </Button>
            <Button onClick={() => handleCreateTimeEntry(false)}>Start</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

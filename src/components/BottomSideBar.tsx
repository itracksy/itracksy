import { useState } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
} from "@/services/hooks/useTimeEntryQueries";
import { Clock, PlayCircle, StopCircle } from "lucide-react";
import { TrackingControls } from "@/components/tracking/TrackingControls";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";

export function BottomSideBar() {
  const [open, setOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  const { data: boards } = useQuery({
    ...convexQuery(api.board.getBoards, {}),
  });

  const { data: selectedBoard } = useQuery({
    ...convexQuery(api.board.getBoard, { id: selectedBoardId }),
    enabled: !!selectedBoardId,
  });

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        end: new Date().getTime(),
      });

      toast({
        title: "Time Entry Stopped",
        description: "Your time entry has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop time entry.",
        variant: "destructive",
      });
    }
  };

  const handleStartTimeEntry = async () => {
    if (activeTimeEntry) return;
    setOpen(true);
  };

  const handleCreateTimeEntry = async () => {
    if (!selectedItemId || !selectedBoardId) return;

    try {
      await createTimeEntry.mutateAsync({
        id: crypto.randomUUID(),
        itemId: selectedItemId,
        boardId: selectedBoardId,
        start: new Date().getTime(),
      });

      toast({
        title: "Time Entry Started",
        description: "New time entry has been started.",
      });
      setOpen(false);
      setSelectedBoardId("");
      setSelectedItemId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start time entry.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <TrackingControls />
      <>
        {isLoading ? (
          <SidebarMenuButton disabled className="w-full justify-start">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </SidebarMenuButton>
        ) : activeTimeEntry ? (
          <SidebarMenuButton
            onClick={handleStopTimeEntry}
            className="hover:text-red-600"
            tooltip={`Stop: ${activeTimeEntry?.item?.title}`}
          >
            <StopCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium">Stop: {activeTimeEntry?.item?.title}</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton
            onClick={handleStartTimeEntry}
            className="hover:text-green-600"
            tooltip="Start new time entry"
          >
            <PlayCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Start new time entry</span>
          </SidebarMenuButton>
        )}
      </>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Board</label>
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {boards?.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBoard && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Task</label>
                {selectedBoard.items && selectedBoard.items.length > 0 ? (
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBoard.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No tasks found in this board. Please select another board or create a new task.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm font-medium text-green-600 hover:text-green-700"
                onClick={handleCreateTimeEntry}
                disabled={!selectedItemId || !selectedBoardId}
              >
                Start
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

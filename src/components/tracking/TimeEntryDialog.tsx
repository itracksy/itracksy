import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useBoardContext } from "@/context/BoardContext";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  onCreateTimeEntry: () => Promise<void>;
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  selectedItemId,
  setSelectedItemId,
  onCreateTimeEntry,
}: TimeEntryDialogProps) {
  const { selectedBoardId, setSelectedBoardId } = useBoardContext();

  const { data: boards } = useQuery({
    ...convexQuery(api.board.getBoards, {}),
  });

  const { data: selectedBoard } = useQuery({
    ...convexQuery(api.board.getBoard, { id: selectedBoardId }),
    enabled: !!selectedBoardId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBoard.items?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={onCreateTimeEntry}
            disabled={!selectedItemId || !selectedBoardId}
            className="w-full"
          >
            Start Time Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

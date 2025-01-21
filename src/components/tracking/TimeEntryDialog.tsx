import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";

import { BoardWithRelations } from "@/types/supabase";
import { getBoard, getBoards } from "@/services/board";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  onCreateTimeEntry: (isFocusMode: boolean) => Promise<void>;
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  selectedItemId,
  setSelectedItemId,
  onCreateTimeEntry,
}: TimeEntryDialogProps) {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });

  const { data: selectedBoard } = useQuery<BoardWithRelations | null>({
    queryKey: ["board", selectedBoardId],
    queryFn: async () => getBoard(selectedBoardId ?? ""),
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
            <Select value={selectedBoardId ?? undefined} onValueChange={setSelectedBoardId}>
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
              <label className="text-sm font-medium">Select Item</label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
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
          <div className="flex flex-row gap-2">
            <Button variant="ghost" size="sm" onClick={() => void onCreateTimeEntry(false)}>
              Normal Mode
            </Button>
            <Button onClick={() => void onCreateTimeEntry(true)} className="w-full">
              Start With Focus Mode
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

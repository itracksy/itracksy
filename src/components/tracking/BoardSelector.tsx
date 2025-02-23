import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BoardSelectorProps {
  selectedItemId: string;
  onItemSelect: (id: string) => void;
}

export function BoardSelector({ selectedItemId, onItemSelect }: BoardSelectorProps) {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: () => trpcClient.board.list.query(),
  });

  const { data: selectedBoard } = useQuery({
    queryKey: ["board", selectedBoardId],
    queryFn: () => trpcClient.board.get.query(selectedBoardId!),
    enabled: !!selectedBoardId,
  });

  return (
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
          <Select value={selectedItemId} onValueChange={onItemSelect}>
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
    </div>
  );
}

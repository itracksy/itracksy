import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc";
import { VirtualizedSelect } from "@/components/virtualized-select";
import { useMemo } from "react";

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

  const boardOptions = useMemo(() => {
    if (!boards) return [];
    return boards.map((board) => ({
      value: board.id,
      label: board.name,
    }));
  }, [boards]);

  const taskOptions = useMemo(() => {
    if (!selectedBoard || !selectedBoard.items) return [];
    return selectedBoard.items.map((item) => ({
      value: item.id,
      label: item.title,
    }));
  }, [selectedBoard]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Board</label>
        <VirtualizedSelect
          options={boardOptions}
          value={selectedBoardId || ""}
          onChange={(id) => {
            setSelectedBoardId(id);
            onItemSelect("");
          }}
          placeholder="Select a board"
          enableSearch={true}
          isDisabled={!boards?.length}
        />
      </div>

      {selectedBoard && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Task</label>
          <VirtualizedSelect
            options={taskOptions}
            value={selectedItemId}
            onChange={onItemSelect}
            placeholder="Select a task"
            enableSearch={true}
            isDisabled={!taskOptions.length}
          />
        </div>
      )}
    </div>
  );
}

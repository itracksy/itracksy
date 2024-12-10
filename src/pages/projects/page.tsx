import { useEffect, useState } from "react";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api.js";

import { Loader } from "@/components/Loader";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BoardView } from "./components/BoardView.js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectsPage() {
  const [boardId, setBoardId] = useState<string | null>(null);

  const { data: board, isLoading: boardLoading } = useQuery({
    ...convexQuery(api.board.getBoard, { id: boardId ?? "" }),
    enabled: !!boardId,
  });
  const { data: boards, isLoading: boardsLoading } = useSuspenseQuery(
    convexQuery(api.board.getBoards, {})
  );

  const handleCreateBoard = async () => {
    const name = prompt("Enter board name:");
    if (name) {
      //   await createBoardMutation.mutate({ name });
    }
  };
  useEffect(() => {
    if (boards.length > 0 && !boardId) {
      setBoardId(boards[0].id);
    }
  }, [boards, boardId]);
  if (boardLoading || boardsLoading) return <Loader />;
  console.log("boards", boards);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b p-4">
        <Select
          value={boardId ?? ""}
          onValueChange={(value) => {
            setBoardId(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreateBoard}>New Board</Button>
      </div>

      {board && <BoardView board={board} />}
    </div>
  );
}

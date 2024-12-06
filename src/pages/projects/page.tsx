import { useEffect, useState } from "react";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api.js";

import { Loader } from "@/components/Loader";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BoardView } from "./components/BoardView.js";

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
      <div className="flex items-center gap-4 border-b bg-white p-4">
        <select
          value={boardId ?? ""}
          onChange={(e) => {
            setBoardId(e.target.value);
          }}
          className="rounded-lg border px-3 py-2"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateBoard}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          New Board
        </button>
      </div>

      {board && <BoardView board={board} />}
    </div>
  );
}

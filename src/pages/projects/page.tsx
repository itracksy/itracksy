import { useCallback, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api.js";
import { useUpdateBoardMutation } from "@/queries";
import { NewColumn } from "./components/NewColumn";
import { Column as ColumnComponent } from "./components/Column";
import type { Column } from "convex/schema";
import { EditableText } from "./components/EditableText";
import { Loader } from "@/components/Loader.js";

export function Board() {
  const newColumnAddedRef = useRef(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const updateBoardMutation = useUpdateBoardMutation();
  const board = convexQuery(api.board.getBoard, { id: boardId ?? "" });
  const boards = convexQuery(api.board.getBoards, {});

  // scroll right when new columns are added
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnRef = useCallback((_node: HTMLElement | null) => {
    if (scrollContainerRef.current && newColumnAddedRef.current) {
      newColumnAddedRef.current = false;
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const itemsById = useMemo(
    () => new Map(board?.items.map((item) => [item.id, item])),
    [board?.items]
  );

  const columns = useMemo(() => {
    if (!board) return [];
    type ColumnWithItems = Column & { items: typeof board.items };
    const columnsMap = new Map<string, ColumnWithItems>();

    for (const column of [...board.columns]) {
      columnsMap.set(column.id, { ...column, items: [] });
    }

    // add items to their columns
    for (const item of itemsById.values()) {
      const columnId = item.columnId;
      const column = columnsMap.get(columnId);
      invariant(column, `missing column: ${columnId} from ${[...columnsMap.keys()]}`);
      column.items.push(item);
    }

    return [...columnsMap.values()].sort((a, b) => a.order - b.order);
  }, [board?.columns, itemsById]);

  const handleCreateBoard = async () => {
    const name = prompt("Enter board name:");
    if (name) {
      //   await createBoardMutation.mutate({ name });
    }
  };

  if (!board) return <Loader />;

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

      <div
        className="flex min-h-0 flex-grow flex-col overflow-x-scroll"
        ref={scrollContainerRef}
        style={{ backgroundColor: board.color }}
      >
        <h1>
          <EditableText
            value={updateBoardMutation.name ?? board.name}
            fieldName="name"
            inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
            buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
            buttonLabel={`Edit board "${board.name}" name`}
            inputLabel="Edit board name"
            onChange={(value) => {
              updateBoardMutation({
                id: board.id,
                name: value,
              });
            }}
          />
        </h1>

        <div className="flex h-full min-h-0 w-fit flex-grow items-start px-8 pb-4">
          {columns.map((col, index) => {
            return (
              <ColumnComponent
                ref={columnRef}
                key={col.id}
                name={col.name}
                columnId={col.id}
                boardId={board.id}
                items={col.items}
                order={col.order}
                previousOrder={columns[index - 1] ? columns[index - 1].order : 0}
                nextOrder={columns[index + 1] ? columns[index + 1].order : col.order + 1}
              />
            );
          })}
          <NewColumn
            boardId={board.id}
            editInitially={board.columns.length === 0}
            onNewColumnAdded={() => {
              newColumnAddedRef.current = true;
            }}
          />
        </div>

        {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
        <div data-lol className="h-1 w-8 flex-shrink-0" />
      </div>
    </div>
  );
}

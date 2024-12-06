import { useCallback, useMemo, useRef } from "react";
import invariant from "tiny-invariant";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api.js";
import { useUpdateBoardMutation } from "@/queries";
import { NewColumn } from "./NewColumn.js";
import { Column as ColumnComponent } from "./Column";
import type { Column } from "convex/schema";
import { EditableText } from "./EditableText";

export function Board({ boardId }: { boardId: string }) {
  const newColumnAddedRef = useRef(false);
  const updateBoardMutation = useUpdateBoardMutation();
  const { data: board } = useSuspenseQuery(convexQuery(api.board.getBoard, { id: boardId }));

  // scroll right when new columns are added
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnRef = useCallback((_node: HTMLElement | null) => {
    if (scrollContainerRef.current && newColumnAddedRef.current) {
      newColumnAddedRef.current = false;
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const itemsById = useMemo(
    () => new Map(board.items.map((item) => [item.id, item])),
    [board.items]
  );

  type ColumnWithItems = Column & { items: typeof board.items };

  const columns = useMemo(() => {
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
  }, [board.columns, itemsById]);

  return (
    <div
      className="flex min-h-0 flex-grow flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: board.color }}
    >
      <h1>
        <EditableText
          value={
            // optimistic update
            updateBoardMutation.isPending && updateBoardMutation.variables.name
              ? updateBoardMutation.variables.name
              : board.name
          }
          fieldName="name"
          inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
          buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
          buttonLabel={`Edit board "${board.name}" name`}
          inputLabel="Edit board name"
          onChange={(value) => {
            updateBoardMutation.mutate({
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
  );
}

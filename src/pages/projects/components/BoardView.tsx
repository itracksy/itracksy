import { useCallback, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";

import { useUpdateBoardMutation } from "@/queries";
import { NewColumn } from "./NewColumn";
import { Column as ColumnComponent } from "./Column";
import type { Column } from "convex/schema";

import { Loader } from "@/components/Loader";
import { GetBoard } from "convex/board";

export function BoardView({ board }: { board: GetBoard }) {
  const newColumnAddedRef = useRef(false);

  const updateBoardMutation = useUpdateBoardMutation();

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-grow flex-col bg-background" ref={scrollContainerRef}>
        <div className="flex h-full min-h-0 w-fit flex-grow items-start gap-2 overflow-x-auto px-8 py-4">
          {columns.map((col, index) => (
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
          ))}
          <NewColumn
            boardId={board.id}
            editInitially={board.columns.length === 0}
            onNewColumnAdded={() => {
              newColumnAddedRef.current = true;
            }}
          />
        </div>

        <div data-lol className="h-1 w-8 flex-shrink-0" />
      </div>
    </div>
  );
}

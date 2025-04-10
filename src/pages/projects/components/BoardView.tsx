import { useCallback, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";

import { NewColumn } from "./NewColumn";
import { Column as ColumnComponent } from "./Column";
import { BoardWithRelations, Column, Item } from "@/types/projects";

export function BoardView({ board }: { board: BoardWithRelations }) {
  const newColumnAddedRef = useRef(false);

  const itemsById = useMemo(
    () => new Map(board.items?.map((item) => [item.id, item]) || []),
    [board.items]
  );

  const columns = useMemo(() => {
    if (!board) return [];
    type ColumnWithItems = Column & { items: Item[] };
    const columnsMap = new Map<string, ColumnWithItems>();

    for (const column of board.columns) {
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

  // Calculate container width based on number of columns
  const containerWidth = useMemo(() => {
    const columnCount = columns.length + 1; // Add 1 for the NewColumn component
    if (columnCount <= 3) {
      return "w-fit"; // Default width for 3 or fewer columns
    }
    // Calculate width for more than 3 columns (approx 320px per column with gap)
    return `w-[${columnCount * 320}px]`;
  }, [columns.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-grow flex-col">
        <div
          className={`flex h-full min-h-0 ${containerWidth} flex-grow items-start gap-4 overflow-x-auto p-6`}
        >
          {columns.map((col, index) => (
            <ColumnComponent
              key={col.id}
              name={col.name}
              columnId={col.id}
              boardId={board.id}
              items={col.items}
              order={col.order}
              previousOrder={columns[index - 1] ? columns[index - 1].order : 0}
              nextOrder={columns[index + 1] ? columns[index + 1].order : col.order + 1}
              className="min-w-[300px] rounded-lg border border-tracksy-gold/20 bg-white/80 shadow-lg backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80"
            />
          ))}
          <NewColumn
            boardId={board.id}
            editInitially={board.columns.length === 0}
            order={columns.length + 1}
            onNewColumnAdded={() => {
              newColumnAddedRef.current = true;
            }}
            className="min-w-[300px] rounded-lg border border-tracksy-gold/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm hover:border-tracksy-gold/40 hover:bg-white dark:border-tracksy-gold/10 dark:bg-gray-900/80 dark:hover:border-tracksy-gold/20 dark:hover:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );
}

import { eq, desc, and } from "drizzle-orm";

import { boards, columns, items } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";

export type Board = typeof boards.$inferSelect;
export type BoardInsert = typeof boards.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type ColumnInsert = typeof columns.$inferInsert;
export type Item = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;

export async function getBoard(id: string, userId: string) {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, id), eq(boards.userId, userId)),
    with: {
      columns: true,
      items: {
        orderBy: desc(items.createdAt),
      },
    },
  });

  return board ?? null;
}

export async function getBoards(userId: string): Promise<Board[]> {
  return await db
    .select()
    .from(boards)
    .where(eq(boards.userId, userId))
    .orderBy(desc(boards.createdAt));
}

export async function createBoard(
  board: Omit<BoardInsert, "id" | "userId">,
  userId: string
): Promise<Board> {
  const newBoard = await db
    .insert(boards)
    .values({
      ...board,
      id: nanoid(),
      userId,
      createdAt: Date.now(),
    })
    .returning();

  return newBoard[0];
}

/**
 * Creates default KanBan columns (ToDo, In Progress, Done) for a board
 * @param boardId - The ID of the board to create columns for
 * @returns - An array of the created columns
 */
export async function createDefaultKanbanColumns(boardId: string): Promise<Column[]> {
  const columnsToCreate = [
    { name: "ToDo", order: 0 },
    { name: "In Progress", order: 1 },
    { name: "Done", order: 2 },
  ];

  const createdColumns: Column[] = [];

  for (const column of columnsToCreate) {
    const newColumn = await createColumn({
      name: column.name,
      boardId,
      order: column.order,
    });

    createdColumns.push(newColumn);
  }

  return createdColumns;
}

export async function updateBoard(
  id: string,
  board: Partial<BoardInsert>,
  userId: string
): Promise<void> {
  await db
    .update(boards)
    .set(board)
    .where(and(eq(boards.id, id), eq(boards.userId, userId)));
}

export async function archiveBoard(id: string, userId: string, archive: boolean): Promise<void> {
  await db
    .update(boards)
    .set({
      deletedAt: archive ? Date.now() : null,
    })
    .where(and(eq(boards.id, id), eq(boards.userId, userId)));
}

export async function createColumn(column: Omit<ColumnInsert, "id">): Promise<Column> {
  const newColumn = await db
    .insert(columns)
    .values({
      ...column,
      id: nanoid(),
      createdAt: Date.now(),
    })
    .returning();

  return newColumn[0];
}

export async function updateColumn(id: string, column: Partial<ColumnInsert>): Promise<void> {
  await db.update(columns).set(column).where(eq(columns.id, id));
}

export async function deleteColumn(id: string): Promise<void> {
  await db.delete(columns).where(eq(columns.id, id));
}

export async function createItem(item: ItemInsert): Promise<Item> {
  const newItem = await db
    .insert(items)
    .values({
      ...item,
      id: nanoid(),
      createdAt: Date.now(),
    })
    .returning();

  return newItem[0];
}

export async function updateItem(id: string, item: Partial<ItemInsert>): Promise<void> {
  await db.update(items).set(item).where(eq(items.id, id));
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(items).where(eq(items.id, id));
}

import { eq, desc, and, inArray, sql, isNull, isNotNull } from "drizzle-orm";

import { boards, columns, items, timeEntries, activities, notifications } from "../db/schema";
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
    .where(and(eq(boards.userId, userId), isNull(boards.deletedAt)))
    .orderBy(desc(boards.createdAt));
}

export async function getArchivedBoards(userId: string): Promise<Board[]> {
  return await db
    .select()
    .from(boards)
    .where(and(eq(boards.userId, userId), isNotNull(boards.deletedAt)))
    .orderBy(desc(boards.deletedAt));
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
  try {
    console.log(`[deleteItem] Starting deletion of item: ${id}`);

    // Enable foreign keys explicitly at the start (sometimes they're not enabled in SQLite)
    await db.run(sql`PRAGMA foreign_keys = ON`);
    console.log(`[deleteItem] Foreign keys enabled`);

    // Check current foreign keys status
    const foreignKeysStatus = await db.get(sql`PRAGMA foreign_keys`);
    console.log(`[deleteItem] Foreign keys status:`, foreignKeysStatus);

    // Check what will be cascade deleted (for logging purposes)
    const relatedTimeEntries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.itemId, id));

    console.log(
      `[deleteItem] Found ${relatedTimeEntries.length} related time entries that will be cascade deleted:`,
      relatedTimeEntries
    );

    // Attempt the deletion - cascade should handle all related data
    console.log(
      `[deleteItem] Attempting to delete item ${id} (cascade delete should handle time entries and notifications)`
    );
    const result = await db.delete(items).where(eq(items.id, id));
    console.log(`[deleteItem] Delete result:`, result);

    console.log(`[deleteItem] Successfully deleted item: ${id}`);
  } catch (error) {
    console.error(`[deleteItem] Error deleting item ${id}:`, error);

    // Additional error information
    if (error instanceof Error) {
      console.error(`[deleteItem] Error name: ${error.name}`);
      console.error(`[deleteItem] Error message: ${error.message}`);
      console.error(`[deleteItem] Error stack: ${error.stack}`);
    }

    throw error;
  }
}

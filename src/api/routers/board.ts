import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import {
  createBoard,
  getBoard,
  getBoards,
  getArchivedBoards,
  createColumn,
  updateColumn,
  deleteColumn,
  createItem,
  updateItem,
  deleteItem,
  updateBoard,
  createDefaultKanbanColumns,
  archiveBoard,
} from "../services/board";
import { boards, columns, items } from "../db/schema";
import { createInsertSchema } from "drizzle-zod";

const boardInsertSchema = createInsertSchema(boards);
const columnInsertSchema = createInsertSchema(columns);
const itemInsertSchema = createInsertSchema(items);

export const boardRouter = t.router({
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return getBoard(input, ctx.userId);
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getBoards(ctx.userId);
  }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    return getArchivedBoards(ctx.userId);
  }),

  create: protectedProcedure
    .input(
      boardInsertSchema.omit({ id: true, userId: true }).extend({
        createDefaultColumns: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { createDefaultColumns, ...boardData } = input;
      const newBoard = await createBoard(boardData, ctx.userId);

      if (createDefaultColumns) {
        await createDefaultKanbanColumns(newBoard.id);
      }

      return newBoard;
    }),

  update: protectedProcedure
    .input(boardInsertSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input: { id, ...data } }) => {
      return updateBoard(id, data, ctx.userId);
    }),

  createColumn: protectedProcedure
    .input(columnInsertSchema.omit({ id: true }))
    .mutation(async ({ input }) => {
      return createColumn(input);
    }),

  updateColumn: protectedProcedure
    .input(columnInsertSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data } }) => {
      return updateColumn(id, data);
    }),

  deleteColumn: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return deleteColumn(input);
  }),

  createItem: protectedProcedure.input(itemInsertSchema).mutation(async ({ input }) => {
    return createItem(input);
  }),

  updateItem: protectedProcedure
    .input(itemInsertSchema.partial().extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data } }) => {
      return updateItem(id, data);
    }),

  deleteItem: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    return deleteItem(input);
  }),

  archive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        archive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return archiveBoard(input.id, ctx.userId, input.archive);
    }),
});

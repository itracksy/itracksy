import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Board, BoardWithRelations } from "@/types/projects";
import { ColumnInsert, ItemInsert } from "@/types/projects";
import { trpcClient } from "@/utils/trpc.js";

export const boardQueries = {
  list: () => ["boards"],
  detail: (id: string) => ["board", id],
};

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newColumn: Omit<ColumnInsert, "id">) => {
      return await trpcClient.board.createColumn.mutate(newColumn);
    },
    onMutate: async (newColumn) => {
      const boardKey = ["board", newColumn.boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          columns: [
            ...(previousBoard.columns || []),
            {
              ...newColumn,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              order: previousBoard.columns?.length + 1,
            },
          ],
        });
      }

      return { previousBoard };
    },
    onError: (err, newColumn, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", newColumn.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: ItemInsert) => {
      return await trpcClient.board.createItem.mutate(newItem);
    },
    onMutate: async (newItem) => {
      const boardKey = ["board", newItem.boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          items: [
            ...previousBoard.items,
            {
              ...newItem,
              content: newItem.content ?? null,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }

      return { previousBoard };
    },
    onError: (err, newItem, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", newItem.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<ItemInsert>) => {
      return await trpcClient.board.updateItem.mutate({ id, ...item });
    },
    onMutate: async ({ id, ...item }) => {
      const boardKey = ["board", item.boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          items: previousBoard.items.map((i) => (i.id === id ? { ...i, ...item } : i)),
        });
      }

      return { previousBoard };
    },
    onError: (err, { id, ...item }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", item.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, { id, ...item }) => {
      queryClient.invalidateQueries({ queryKey: ["board", item.boardId] });
    },
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.board.deleteItem.mutate(id);
    },
    onMutate: async (id) => {
      // We need to get the board ID from the current board data
      const boards = queryClient.getQueriesData<BoardWithRelations>({ queryKey: ["board"] });
      const board = boards.find(([_, data]) => data?.items.some((item) => item.id === id))?.[1];

      if (!board) return;

      const boardKey = ["board", board.id];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          items: previousBoard.items.filter((i) => i.id !== id),
        });
      }

      return { previousBoard, boardId: board.id };
    },
    onError: (err, id, context) => {
      if (context?.previousBoard && context.boardId) {
        queryClient.setQueryData(["board", context.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, id, context) => {
      if (context?.boardId) {
        queryClient.invalidateQueries({ queryKey: ["board", context.boardId] });
      }
    },
  });
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.board.deleteColumn.mutate(id);
    },
    onMutate: async (id) => {
      // We need to get the board ID from the current board data
      const boards = queryClient.getQueriesData<BoardWithRelations>({ queryKey: ["board"] });
      const board = boards.find(([_, data]) => data?.columns.some((col) => col.id === id))?.[1];

      if (!board) return;

      const boardKey = ["board", board.id];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          columns: previousBoard.columns.filter((c) => c.id !== id),
          items: previousBoard.items.filter((i) => i.columnId !== id),
        });
      }

      return { previousBoard, boardId: board.id };
    },
    onError: (err, id, context) => {
      if (context?.previousBoard && context.boardId) {
        queryClient.setQueryData(["board", context.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, id, context) => {
      if (context?.boardId) {
        queryClient.invalidateQueries({ queryKey: ["board", context.boardId] });
      }
    },
  });
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...column }: { id: string } & Partial<ColumnInsert>) => {
      return await trpcClient.board.updateColumn.mutate({ id, ...column });
    },
    onMutate: async ({ id, ...column }) => {
      const boardKey = ["board", column.boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          columns: previousBoard.columns.map((c) => (c.id === id ? { ...c, ...column } : c)),
        });
      }

      return { previousBoard };
    },
    onError: (err, { id, ...column }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", column.boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, { id, ...column }) => {
      queryClient.invalidateQueries({ queryKey: ["board", column.boardId] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumn,
  createItem,
  deleteColumn,
  deleteItem,
  updateColumn,
  updateItem,
} from "../api/services/board";
import { Board, BoardWithRelations } from "@/types/supabase";
import { ColumnInsert, ItemInsert } from "@/types/supabase";

export const boardQueries = {
  list: () => {}, // TO DO: implement list query
  detail: (id: string) => {}, // TO DO: implement detail query
};

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createColumn,
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
    mutationFn: createItem,
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
      await updateItem(id, item);
    },
    onMutate: async (newItem) => {
      const boardKey = ["board", newItem.boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          items: previousBoard.items?.map((item) =>
            item.id === newItem.id
              ? { ...item, ...newItem, content: newItem.content ?? null }
              : item
          ),
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      await deleteItem(id);
    },
    onMutate: async ({ id, boardId }) => {
      const boardKey = ["board", boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          items: previousBoard.items?.filter((item) => item.id !== id),
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; boardId: string }) => {
      await deleteColumn(id);
    },
    onMutate: async ({ id, boardId }) => {
      const boardKey = ["board", boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          columns: previousBoard.columns?.filter((col) => col.id !== id),
          items: previousBoard.items?.filter((item) => item.columnId !== id),
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...column }: { id: string } & Partial<ColumnInsert>) => {
      await updateColumn(id, column);
    },
    onMutate: async ({ id, boardId, ...newColumn }) => {
      const boardKey = ["board", boardId];
      await queryClient.cancelQueries({ queryKey: boardKey });

      const previousBoard = queryClient.getQueryData<BoardWithRelations>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<BoardWithRelations>(boardKey, {
          ...previousBoard,
          columns: previousBoard.columns?.map((col) =>
            col.id === id ? { ...col, ...newColumn } : col
          ),
        });
      }

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

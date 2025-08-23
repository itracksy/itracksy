import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Board, BoardWithRelations } from "@/types/projects";
import { ColumnInsert, ItemInsert } from "@/types/projects";
import { trpcClient } from "@/utils/trpc.js";

export const boardQueries = {
  list: () => ["boards"],
  listArchived: () => ["archivedBoards"],
  detail: (id: string) => ["board", id],
};

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trpcClient.board.createColumn.mutate,
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.createItem.mutate,
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.updateItem.mutate,
    onSettled: (data, error, { id, ...item }) => {
      queryClient.invalidateQueries({ queryKey: ["board", item.boardId] });
    },
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.deleteItem.mutate,
    onSettled: (data, error, itemId) => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.deleteColumn.mutate,
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.updateColumn.mutate,
    onMutate: async ({ id, ...column }) => {
      // For reordering columns, ensure we're using integer values
      console.log("Updating column", id, column);
      if (column.order !== undefined) {
        column.order = Math.floor(column.order);
      }
      return { id, ...column };
    },
    onSettled: (data, error, { id, ...column }) => {
      // Ensure we invalidate the board query so the UI reflects the column order change
      console.log("Invalidating board query for column update", column);
      queryClient.invalidateQueries({ queryKey: ["board", column.boardId] });
    },
  });
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.update.mutate,
    onSettled: (data, error, { id, ...board }) => {
      queryClient.invalidateQueries({ queryKey: ["board", id] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useArchiveBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.archive.mutate,
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["board", id] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["archivedBoards"] });
    },
  });
}

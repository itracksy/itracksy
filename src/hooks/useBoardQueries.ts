import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Board, BoardWithRelations } from "@/types/projects";
import { ColumnInsert, ItemInsert } from "@/types/projects";
import { trpcClient } from "@/utils/trpc.js";

export const boardQueries = {
  list: () => ["boards"],
  detail: (id: string) => ["board", id],
};

export function useCreateColumnMutation() {
  return useMutation({
    mutationFn: trpcClient.board.createColumn.mutate,
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
  });
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.deleteColumn.mutate,
  });
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.board.updateColumn.mutate,

    onSettled: (data, error, { id, ...column }) => {
      queryClient.invalidateQueries({ queryKey: ["board", column.boardId] });
    },
  });
}

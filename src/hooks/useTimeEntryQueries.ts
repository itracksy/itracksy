import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { useToast } from "./use-toast";

export function useActiveTimeEntry() {
  return useQuery({
    queryKey: ["timeEntries", "active"],
    queryFn: () => trpcClient.timeEntry.getActive.query(),
  });
}

export function useTimeEntriesForItem(itemId: string) {
  return useQuery({
    queryKey: ["timeEntries", "item", itemId],
    queryFn: () => trpcClient.timeEntry.getForItem.query(itemId),
    enabled: !!itemId,
  });
}

export function useCreateTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.timeEntry.create.mutate,
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useUpdateTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trpcClient.timeEntry.update.mutate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      if (data.endTime) {
        console.log("invalidating active time entry", data.endTime);
        queryClient.invalidateQueries({ queryKey: ["timeEntries", "active"] });
      }
      queryClient.invalidateQueries({ queryKey: ["board", data.boardId] });
    },
  });
}

export function useDeleteTimeEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: trpcClient.timeEntry.delete.mutate,
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["timeEntries"],
      });
    },
  });
}

export function useLastTimeEntry() {
  return useQuery({
    queryKey: ["timeEntries", "last"],
    queryFn: async () => {
      const result = await trpcClient.timeEntry.getLast.query();
      return result ?? null; // Ensure we always return null instead of undefined
    },
  });
}

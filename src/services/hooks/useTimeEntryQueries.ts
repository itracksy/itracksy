import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTimeEntry,
  deleteTimeEntry,
  getActiveTimeEntry,
  getTimeEntriesForItem,
  updateTimeEntry,
} from "../timeEntry";
import type { TimeEntry, TimeEntryInsert } from "@/types/supabase";

export function useActiveTimeEntry() {
  return useQuery({
    queryKey: ["timeEntries", "active"],
    queryFn: getActiveTimeEntry,
  });
}

export function useTimeEntriesForItem(itemId: string) {
  return useQuery({
    queryKey: ["timeEntries", "item", itemId],
    queryFn: () => getTimeEntriesForItem(itemId),
    enabled: !!itemId,
  });
}

export function useCreateTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["board", data?.board_id] });
    },
  });
}

export function useUpdateTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...timeEntry }: { id: string } & Partial<TimeEntryInsert>) => {
      const { data, error } = await updateTimeEntry(id, timeEntry);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log("updating time entry", data);
      if (data.end_time) {
        console.log("invalidating active time entry", data.end_time);
        queryClient.invalidateQueries({ queryKey: ["timeEntries", "active"] });
      }
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["board", data.board_id] });
    },
  });
}

export function useDeleteTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, itemId }: { id: string; itemId: string }) => {
      const { error } = await deleteTimeEntry(id);
      if (error) throw error;
      return { id, itemId };
    },
    onMutate: async ({ id, itemId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["timeEntries", "item", itemId] });

      // Snapshot the previous value
      const previousTimeEntries = queryClient.getQueryData<TimeEntry[]>([
        "timeEntries",
        "item",
        itemId,
      ]);

      // Optimistically update to the new value
      if (previousTimeEntries) {
        queryClient.setQueryData<TimeEntry[]>(
          ["timeEntries", "item", itemId],
          previousTimeEntries.filter((entry) => entry.id !== id)
        );
      }

      return { previousTimeEntries };
    },
    onError: (err, { itemId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTimeEntries) {
        queryClient.setQueryData(["timeEntries", "item", itemId], context.previousTimeEntries);
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
        queryClient.invalidateQueries({ queryKey: ["timeEntries", "item", data.itemId] });
      }
    },
  });
}

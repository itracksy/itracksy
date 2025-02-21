import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimeEntry, TimeEntryInsert } from "@/types/supabase";

import { useAuth } from "@/hooks/useAuth";
import { trpcClient } from "@/utils/trpc";

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
    mutationFn: (timeEntry: Omit<TimeEntryInsert, "userId">) => {
      return trpcClient.timeEntry.create.mutate(timeEntry);
    },
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useUpdateTimeEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<TimeEntryInsert>) => {
      return trpcClient.timeEntry.update.mutate({ id, ...data });
    },
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

  return useMutation({
    mutationFn: (input: { id: string; itemId: string }) => {
      return trpcClient.timeEntry.delete.mutate(input.id);
    },
    onMutate: async ({ id, itemId }) => {
      const timeEntriesKey = ["timeEntries", "item", itemId];
      await queryClient.cancelQueries({ queryKey: timeEntriesKey });

      const previousTimeEntries = queryClient.getQueryData<TimeEntry[]>(timeEntriesKey);

      if (previousTimeEntries) {
        queryClient.setQueryData<TimeEntry[]>(timeEntriesKey, (old) =>
          old?.filter((entry) => entry.id !== id)
        );
      }

      return { previousTimeEntries };
    },
    onError: (err, { itemId }, context) => {
      if (context?.previousTimeEntries) {
        queryClient.setQueryData(["timeEntries", "item", itemId], context.previousTimeEntries);
      }
    },
    onSettled: (data, error, { itemId }) => {
      queryClient.invalidateQueries({
        queryKey: ["timeEntries", "item", itemId],
      });
    },
  });
}

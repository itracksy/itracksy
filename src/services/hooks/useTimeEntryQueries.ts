import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";

export function useActiveTimeEntry() {
  return useQuery(convexQuery(api.timeEntries.getActiveTimeEntry, {}));
}

// Hook to create a time entry
export function useCreateTimeEntryMutation() {
  const mutationFn = useConvexMutation(api.timeEntries.createTimeEntry);
  return useMutation({ mutationFn });
}

// Hook to update a time entry
export function useUpdateTimeEntryMutation() {
  const mutationFn = useConvexMutation(api.timeEntries.updateTimeEntry);
  return useMutation({ mutationFn });
}

// Hook to delete a time entry
export function useDeleteTimeEntryMutation() {
  const mutationFn = useConvexMutation(api.timeEntries.deleteTimeEntry).withOptimisticUpdate(
    (localStore, args) => {
      const item = localStore.getQuery(api.board.getItem, { id: args.itemId });
      if (!item) return;

      const timeEntries = item.timeEntries.filter((entry) => entry.id !== args.id);
      localStore.setQuery(api.board.getItem, { id: item.id }, { ...item, timeEntries });
    }
  );

  return useMutation({ mutationFn });
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";

export function useActiveTimeEntry() {
  return useQuery(convexQuery(api.timeEntries.getActiveTimeEntry, {}));
}

// Hook to create a time entry
export function useCreateTimeEntryMutation() {
  const mutationFn = useConvexMutation(api.timeEntries.createTimeEntry).withOptimisticUpdate(
    (localStore, args) => {
      // Check if there's an active time entry and stop it
      const activeEntry = localStore.getQuery(api.timeEntries.getActiveTimeEntry, {});

      if (activeEntry) {
        // Update the active entry to be stopped
        localStore.setQuery(
          api.timeEntries.getActiveTimeEntry,
          {},
          { ...activeEntry, end: Date.now() }
        );
      }

      // Update the item's time entries
      const item = localStore.getQuery(api.board.getItem, { id: args.itemId });
      if (!item) return;

      const timeEntries = [...item.timeEntries, args];
      localStore.setQuery(api.board.getItem, { id: item.id }, { ...item, timeEntries });
    }
  );

  return useMutation({ mutationFn });
}

// Hook to update a time entry
export function useUpdateTimeEntryMutation() {
  const mutationFn = useConvexMutation(api.timeEntries.updateTimeEntry).withOptimisticUpdate(
    (localStore, args) => {
      const item = localStore.getQuery(api.board.getItem, { id: args.itemId });
      if (!item) return;

      const timeEntries = item.timeEntries.map((entry) =>
        entry.id === args.id ? { ...entry, ...args } : entry
      );
      localStore.setQuery(api.board.getItem, { id: item.id }, { ...item, timeEntries });
    }
  );

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

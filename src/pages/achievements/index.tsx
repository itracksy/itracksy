import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInfiniteQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeEntryList } from "./components/TimeEntryList";
import { Loader2 } from "lucide-react";

// Define the type for the API response
type TimeEntriesResponse = {
  entries: any[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
};

const AchievementsPage: React.FC = () => {
  const limit = 10;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<TimeEntriesResponse>({
      queryKey: ["timeEntries"],
      queryFn: ({ pageParam = 1 }) =>
        trpcClient.timeEntry.getTimeEntries.query({
          page: Number(pageParam),
          limit,
        }),
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
    });

  // Handle scroll to bottom to load more entries
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const scrollElement = scrollAreaRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;

    // Load more entries when user scrolls near the bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Combine all entries from all pages
  const timeEntries = data?.pages.flatMap((page) => page.entries) || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Achievements</h1>

      <div className="p-4">
        <ScrollArea className="h-full" ref={scrollAreaRef} onScroll={handleScroll}>
          {status === "pending" ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : status === "error" ? (
            <p className="text-center text-red-500">Error loading sessions</p>
          ) : timeEntries.length > 0 ? (
            <>
              <TimeEntryList timeEntries={timeEntries} />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground">No sessions recorded yet</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AchievementsPage;

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeEntryList } from "./components/TimeEntryList";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AchievementsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const { data: timeEntriesData } = useQuery({
    queryKey: ["timeEntries", currentPage, limit],
    queryFn: () =>
      trpcClient.timeEntry.getTimeEntries.query({
        page: currentPage,
        limit,
      }),
  });

  const timeEntries = timeEntriesData?.entries || [];
  const pagination = timeEntriesData?.pagination;

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Achievements</h1>

      <Card className="border-none shadow-none">
        <CardContent className="p-4">
          <ScrollArea className="h-full">
            {timeEntries.length > 0 ? (
              <TimeEntryList timeEntries={timeEntries} />
            ) : (
              <p className="text-center text-muted-foreground">No sessions recorded yet</p>
            )}
          </ScrollArea>
        </CardContent>
        {pagination && pagination.totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AchievementsPage;

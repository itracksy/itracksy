import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeEntryList } from "./components/TimeEntryList";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Session {
  id: string;
  type: "focus" | "break";
  duration: number;
  startTime: Date;
  endTime: Date;
}

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
      <h1 className="mb-8 text-3xl font-bold">Achievements</h1>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Focus Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {timeEntries
                      ? formatDuration(
                          timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
                        )
                      : "0 min"}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Focus Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {timeEntries.length > 0 ? (
                  <TimeEntryList timeEntries={timeEntries} />
                ) : (
                  <p className="text-muted-foreground">No sessions recorded yet</p>
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                    }
                    disabled={currentPage >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Weekly statistics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Monthly statistics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;

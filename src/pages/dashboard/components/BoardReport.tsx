import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function BoardReport() {
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // Get all boards for the user
  const { data: boards } = useQuery({
    ...convexQuery(api.board.getBoards, {}),
  });

  // Get time entries for the selected board
  const { data: timeEntries } = useQuery({
    ...convexQuery(api.timeEntries.getBoardTimeEntries, { boardId: selectedBoardId }),
    enabled: !!selectedBoardId,
  });

  // Calculate total time spent on the board
  const totalTime = timeEntries?.reduce((acc, entry) => {
    const duration = entry.end ? entry.end - entry.start : 0;
    return acc + duration;
  }, 0);

  // Format time to hours and minutes
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Group time entries by item
  const itemBreakdown = timeEntries?.reduce(
    (acc, entry) => {
      if (!acc[entry.itemId]) {
        acc[entry.itemId] = 0;
      }
      acc[entry.itemId] += entry.end ? entry.end - entry.start : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Board Time Report</CardTitle>
        <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a board" />
          </SelectTrigger>
          <SelectContent>
            {boards?.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {selectedBoardId && timeEntries ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Time</h3>
              <p className="text-2xl font-bold">{formatTime(totalTime || 0)}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Task Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(itemBreakdown || {}).map(([itemId, time]) => {
                  const item = timeEntries.find((entry) => entry.itemId === itemId)?.item;
                  return (
                    <div key={itemId} className="flex justify-between">
                      <span className="truncate text-sm">{item?.title || "Unknown Task"}</span>
                      <span className="text-sm font-medium">{formatTime(time)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a board to view time report</div>
        )}
      </CardContent>
    </Card>
  );
}

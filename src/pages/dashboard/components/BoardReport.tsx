import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";

import { formatDuration } from "@/utils/timeUtils";
import { getBoards } from "@/services/board";
import { getTimeEntriesForBoard } from "@/services/timeEntry";

export function BoardReport() {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);

  // Get all boards for the user
  const { data: boards = [] } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });

  // Get time entries for the selected board
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["timeEntries", selectedBoardId],
    queryFn: () => getTimeEntriesForBoard(selectedBoardId ?? ""),
    enabled: !!selectedBoardId,
  });

  // Calculate total time spent on the board
  const totalTime = timeEntries.reduce((acc, entry) => {
    const start = new Date(entry.start_time).getTime();
    const end = entry.end_time ? new Date(entry.end_time).getTime() : 0;
    const duration = end ? end - start : 0;
    return acc + duration;
  }, 0);
  // Group time entries by item
  const itemBreakdown = timeEntries.reduce(
    (acc, entry) => {
      const start = new Date(entry.start_time).getTime();
      const end = entry.end_time ? new Date(entry.end_time).getTime() : 0;
      const duration = end ? end - start : 0;

      if (!acc[entry.item_id]) {
        acc[entry.item_id] = {
          duration: 0,
          title: entry.items?.title || "Unknown Task",
        };
      }
      acc[entry.item_id].duration += duration;
      return acc;
    },
    {} as Record<string, { duration: number; title: string }>
  );

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-tracksy-blue dark:text-white">Board Time Report</CardTitle>
        <Select value={selectedBoardId ?? ""} onValueChange={setSelectedBoardId}>
          <SelectTrigger className="border-tracksy-gold/30 dark:border-tracksy-gold/20 text-tracksy-blue dark:text-white hover:border-tracksy-gold/50 dark:hover:border-tracksy-gold/40 bg-white dark:bg-gray-900">
            <SelectValue placeholder="Select a board" />
          </SelectTrigger>
          <SelectContent className="border-tracksy-gold/30 dark:border-tracksy-gold/20 bg-white dark:bg-gray-900">
            {boards.map((board) => (
              <SelectItem 
                key={board.id} 
                value={board.id}
                className="text-tracksy-blue dark:text-white hover:bg-tracksy-gold/5 dark:hover:bg-tracksy-gold/10"
              >
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
              <h3 className="text-sm font-medium text-tracksy-blue/70 dark:text-white/70">Total Time</h3>
              <p className="text-2xl font-bold text-tracksy-blue dark:text-white">{formatDuration(totalTime)}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-tracksy-blue/70 dark:text-white/70">Task Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(itemBreakdown).map(([itemId, { duration, title }]) => (
                  <div key={itemId} className="flex justify-between">
                    <span className="truncate text-sm text-tracksy-blue dark:text-white">{title}</span>
                    <span className="text-sm font-medium text-tracksy-blue/90 dark:text-white/90">
                      {formatDuration(duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-tracksy-blue/70 dark:text-white/70">Select a board to view time report</div>
        )}
      </CardContent>
    </Card>
  );
}

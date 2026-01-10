import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedAnalyticsBoardIdAtom } from "@/context/timeRange";
import { trpcClient } from "@/utils/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid } from "lucide-react";

export function AnalyticsBoardSelector() {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedAnalyticsBoardIdAtom);

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: () => trpcClient.board.list.query(),
  });

  return (
    <Select
      value={selectedBoardId ?? "all"}
      onValueChange={(value) => setSelectedBoardId(value === "all" ? undefined : value)}
    >
      <SelectTrigger className="w-44 border-[#E5A853]/30">
        <LayoutGrid className="mr-2 h-4 w-4 text-[#E5A853]" />
        <SelectValue placeholder="All Boards" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Boards</SelectItem>
        {boards?.map((board) => (
          <SelectItem key={board.id} value={board.id}>
            {board.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

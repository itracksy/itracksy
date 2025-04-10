import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Loader } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BoardView } from "./components/BoardView.js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { LayoutGrid, List, PlusCircle, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.js";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc.js";
import { useUpdateBoardMutation } from "@/hooks/useBoardQueries";
import { BoardDialog } from "./components/BoardDialog";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().int("Hourly rate must be a whole number").optional(),
  currency: z.string().optional(),
});

export function ProjectsPage() {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["board", selectedBoardId],
    queryFn: async () => {
      if (!selectedBoardId) return null;
      return await trpcClient.board.get.query(selectedBoardId);
    },
    enabled: !!selectedBoardId,
  });

  const { data: boards, isLoading: boardsLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      return await trpcClient.board.list.query();
    },
  });

  const createBoardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await trpcClient.board.create.mutate({
        name: values.name.trim(),
        color: values.color,
        hourlyRate: values.hourlyRate,
        currency: values.currency,
      });
    },
    onSuccess: (data) => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSelectedBoardId(data.id);
    },
  });

  const updateBoardMutation = useUpdateBoardMutation();

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (editOpen && selectedBoardId) {
      updateBoardMutation.mutate({
        id: selectedBoardId,
        ...values,
      });
      setEditOpen(false);
    } else {
      createBoardMutation.mutate(values);
    }
  };

  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  if (boardLoading || boardsLoading) return <Loader />;

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-tracksy-blue/5 to-tracksy-gold/5">
      <div className="flex items-center justify-between border-b border-tracksy-gold/20 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Select
            value={selectedBoardId ?? ""}
            onValueChange={(value) => {
              if (value === "new") {
                setOpen(true);
                return;
              }
              setSelectedBoardId(value);
            }}
          >
            <SelectTrigger className="w-[180px] border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 dark:border-tracksy-gold/20 dark:bg-gray-900 dark:text-white dark:hover:border-tracksy-gold/40">
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent className="border-tracksy-gold/30 bg-white dark:border-tracksy-gold/20 dark:bg-gray-900">
              {boards?.map((board) => (
                <SelectItem
                  key={board.id}
                  value={board.id}
                  className="text-tracksy-blue hover:bg-tracksy-gold/5 dark:text-white dark:hover:bg-tracksy-gold/10"
                >
                  {board.name}
                </SelectItem>
              ))}
              <SelectSeparator className="bg-tracksy-gold/20 dark:bg-tracksy-gold/10" />
              <SelectItem value="new" onSelect={() => setOpen(true)}>
                <div className="flex items-center gap-2 text-tracksy-gold hover:text-white dark:text-white/80">
                  <PlusCircle className="h-4 w-4" /> Create Board
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {board && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditOpen(true)}
                  aria-label="Edit board settings"
                  className="border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 hover:bg-tracksy-gold/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit board settings</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
              aria-label={viewMode === "board" ? "Switch to list view" : "Switch to board view"}
              className="border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 hover:bg-tracksy-gold/10"
            >
              {viewMode === "board" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{viewMode === "board" ? "Switch to list view" : "Switch to board view"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {board && viewMode === "board" && <BoardView board={board} />}
      {board && viewMode === "list" && (
        <div className="p-6">
          <div className="rounded-lg border border-tracksy-gold/20 bg-white shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-tracksy-gold/20 hover:bg-tracksy-gold/5">
                  <TableHead className="text-tracksy-blue">Title</TableHead>
                  <TableHead className="text-tracksy-blue">Status</TableHead>
                  <TableHead className="text-tracksy-blue">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {board.items.map((item) => {
                  const column = board.columns.find((col) => col.id === item.columnId);

                  return (
                    <TableRow key={item.id} className="hover:bg-tracksy-gold/5">
                      <TableCell className="font-medium text-tracksy-blue">{item.title}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-tracksy-gold/10 px-2 py-1 text-sm text-tracksy-blue">
                          {column?.name || "No Status"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {item.content || "No description"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <BoardDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} mode="create" />

      <BoardDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleSubmit}
        mode="edit"
        initialData={
          board
            ? {
                name: board.name,
                color: board.color,
                hourlyRate: board.hourlyRate,
                currency: board.currency,
              }
            : undefined
        }
      />
    </div>
  );
}

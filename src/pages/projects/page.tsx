import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Archive,
  LayoutGrid,
  List,
  MoreVertical,
  PlusCircle,
  Settings,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.js";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc.js";
import { useUpdateBoardMutation, useArchiveBoardMutation } from "@/hooks/useBoardQueries";
import { BoardDialog } from "./components/BoardDialog";
import { ArchivedBoardsDialog } from "./components/ArchivedBoardsDialog";
import { ItemDetailDialog } from "./components/ItemDetailDialog";
import { Item } from "@/types/projects";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().int("Hourly rate must be a whole number").optional(),
  currency: z.string().optional(),
  createDefaultColumns: z.boolean().default(true),
});

export function ProjectsPage() {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archivedBoardsDialogOpen, setArchivedBoardsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemDetailOpen, setItemDetailOpen] = useState(false);

  // Simple filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"title" | "status" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const { data: archivedBoards, isLoading: archivedBoardsLoading } = useQuery({
    queryKey: ["archivedBoards"],
    queryFn: async () => {
      return await trpcClient.board.listArchived.query();
    },
  });

  // Filter boards to show only active (non-archived) boards
  const activeBoards = boards;

  const createBoardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { createDefaultColumns, ...boardData } = values;
      return await trpcClient.board.create.mutate({
        ...boardData,
        name: boardData.name.trim(),
        createDefaultColumns,
      });
    },
    onSuccess: (data) => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSelectedBoardId(data.id);
    },
  });

  const updateBoardMutation = useUpdateBoardMutation();
  const archiveBoardMutation = useArchiveBoardMutation();

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, columnId }: { itemId: string; columnId: string }) => {
      return await trpcClient.board.updateItem.mutate({
        id: itemId,
        columnId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", selectedBoardId] });
    },
  });

  const handleStatusChange = (itemId: string, columnId: string) => {
    updateItemMutation.mutate({ itemId, columnId });
  };

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

  const handleArchiveBoard = (archive: boolean) => {
    if (!selectedBoardId) return;

    archiveBoardMutation.mutate({
      id: selectedBoardId,
      archive,
    });
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!board) return [];

    return board.items
      .filter((item) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          (item.content && item.content.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "status": {
            const columnA = board.columns.find((col) => col.id === a.columnId);
            const columnB = board.columns.find((col) => col.id === b.columnId);
            comparison = (columnA?.name || "").localeCompare(columnB?.name || "");
            break;
          }
          case "createdAt":
            comparison = (a.createdAt || 0) - (b.createdAt || 0);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [board, searchQuery, sortField, sortDirection]);

  const handleSortChange = (field: "title" | "status" | "createdAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (activeBoards && activeBoards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(activeBoards[0].id);
    } else if (activeBoards && activeBoards.length === 0 && selectedBoardId) {
      // If there are no active boards but a board is selected
      setSelectedBoardId("");
    }
  }, [activeBoards, selectedBoardId, setSelectedBoardId]);

  if (boardLoading || boardsLoading || archivedBoardsLoading) return <Loader />;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent>
              {activeBoards?.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="new">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Create Board
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {board && (
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
              >
                {viewMode === "board" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{viewMode === "board" ? "List view" : "Board view"}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setArchivedBoardsDialogOpen(true)}>
                <Archive className="mr-2 h-4 w-4" />
                Archived Boards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {board && viewMode === "board" && <BoardView board={board} />}
      {board && viewMode === "list" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-lg border bg-card">
            {/* Simple Search */}
            <div className="flex items-center gap-3 border-b p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-sm text-muted-foreground">{filteredItems.length} tasks</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortField === "title" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[140px] cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[100px] cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortField === "createdAt" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      {searchQuery ? "No tasks match your search" : "No tasks yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const column = board.columns.find((col) => col.id === item.columnId);

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedItem(item);
                          setItemDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Select
                            value={item.columnId}
                            onValueChange={(columnId) => handleStatusChange(item.id, columnId)}
                          >
                            <SelectTrigger
                              className="h-8 w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder={column?.name || "No Status"} />
                            </SelectTrigger>
                            <SelectContent>
                              {board.columns.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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
        onArchive={handleArchiveBoard}
        initialData={
          board
            ? {
                name: board.name,
                color: board.color,
                hourlyRate: board.hourlyRate,
                currency: board.currency,
                deletedAt: board.deletedAt,
              }
            : undefined
        }
      />

      {/* Archived Boards Dialog */}
      <ArchivedBoardsDialog
        open={archivedBoardsDialogOpen}
        onOpenChange={setArchivedBoardsDialogOpen}
        archivedBoards={archivedBoards || []}
      />

      {/* Item Detail Dialog */}
      {selectedItem && (
        <ItemDetailDialog
          open={itemDetailOpen}
          onOpenChange={setItemDetailOpen}
          item={selectedItem}
        />
      )}
    </div>
  );
}

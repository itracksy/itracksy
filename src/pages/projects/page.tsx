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
import { Input } from "@/components/ui/input";
import {
  Archive,
  LayoutGrid,
  List,
  MoreVertical,
  PlusCircle,
  Settings,
  Search,
  Filter,
  X,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAtom } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc.js";
import { useUpdateBoardMutation, useArchiveBoardMutation } from "@/hooks/useBoardQueries";
import { BoardDialog } from "./components/BoardDialog";
import { ArchivedBoardsDialog } from "./components/ArchivedBoardsDialog";

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

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<"title" | "status" | "createdAt">("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // Filter items based on search query and status filter
  const filteredItems =
    board?.items
      .filter((item) => {
        const column = board.columns.find((col) => col.id === item.columnId);
        const matchesSearch =
          searchQuery === "" ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "all" || item.columnId === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const columnA = board.columns.find((col) => col.id === a.columnId);
        const columnB = board.columns.find((col) => col.id === b.columnId);

        let comparison = 0;

        switch (sortField) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "status":
            comparison = (columnA?.name || "").localeCompare(columnB?.name || "");
            break;
          case "createdAt":
            comparison = (a.createdAt || 0) - (b.createdAt || 0);
            break;
          default:
            comparison = 0;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      }) || [];

  // Clear all filters and sorting
  const clearAll = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortField("title");
    setSortDirection("asc");
  };

  // Handle sort change
  const handleSortChange = (field: "title" | "status" | "createdAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Check if sorting is active (not default)
  const hasActiveSorting = sortField !== "title" || sortDirection !== "asc";

  // Format date utility
  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
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
              {activeBoards?.map((board) => (
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
        <div className="flex items-center gap-2">
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

          {/* Three-dot menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 hover:bg-tracksy-gold/10"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-tracksy-gold/20 dark:border-tracksy-gold/10 dark:bg-gray-900"
            >
              <DropdownMenuLabel className="text-tracksy-blue dark:text-tracksy-gold">
                Options
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-tracksy-gold/20 dark:bg-tracksy-gold/10" />
              <DropdownMenuItem
                onClick={() => setArchivedBoardsDialogOpen(true)}
                className="flex cursor-pointer items-center text-tracksy-blue hover:bg-tracksy-gold/5 dark:text-white dark:hover:bg-tracksy-gold/10"
              >
                <Archive className="mr-2 h-4 w-4" />
                Show Archived Boards
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setOpen(true)}
                className="flex cursor-pointer items-center text-tracksy-blue hover:bg-tracksy-gold/5 dark:text-white dark:hover:bg-tracksy-gold/10"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {board && viewMode === "board" && <BoardView board={board} />}
      {board && viewMode === "list" && (
        <div className="p-6">
          <div className="rounded-lg border border-tracksy-gold/20 bg-white shadow-lg dark:border-tracksy-gold/10 dark:bg-gray-900">
            {/* Filter Section */}
            <div className="border-b border-tracksy-gold/20 p-4 dark:border-tracksy-gold/10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-tracksy-blue dark:text-tracksy-gold">
                  Tasks ({filteredItems.length} of {board.items.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 hover:bg-tracksy-gold/10 dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white dark:hover:border-tracksy-gold/40"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                  {(hasActiveFilters || hasActiveSorting) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      className="border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 hover:bg-tracksy-gold/10 dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white dark:hover:border-tracksy-gold/40"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-tracksy-gold/30 bg-white pl-9 text-tracksy-blue dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-tracksy-gold/30 bg-white text-tracksy-blue dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="border-tracksy-gold/30 bg-white dark:border-tracksy-gold/20 dark:bg-gray-800">
                      <SelectItem value="all" className="text-tracksy-blue dark:text-white">
                        All Statuses
                      </SelectItem>
                      {board.columns.map((column) => (
                        <SelectItem
                          key={column.id}
                          value={column.id}
                          className="text-tracksy-blue dark:text-white"
                        >
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Field */}
                  <Select
                    value={sortField}
                    onValueChange={(value: "title" | "status" | "createdAt") =>
                      handleSortChange(value)
                    }
                  >
                    <SelectTrigger className="border-tracksy-gold/30 bg-white text-tracksy-blue dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="border-tracksy-gold/30 bg-white dark:border-tracksy-gold/20 dark:bg-gray-800">
                      <SelectItem value="title" className="text-tracksy-blue dark:text-white">
                        Title
                      </SelectItem>
                      <SelectItem value="status" className="text-tracksy-blue dark:text-white">
                        Status
                      </SelectItem>
                      <SelectItem value="createdAt" className="text-tracksy-blue dark:text-white">
                        Created Date
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Direction */}
                  <Select
                    value={sortDirection}
                    onValueChange={(value: "asc" | "desc") => setSortDirection(value)}
                  >
                    <SelectTrigger className="border-tracksy-gold/30 bg-white text-tracksy-blue dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Sort direction" />
                    </SelectTrigger>
                    <SelectContent className="border-tracksy-gold/30 bg-white dark:border-tracksy-gold/20 dark:bg-gray-800">
                      <SelectItem value="asc" className="text-tracksy-blue dark:text-white">
                        Ascending (A-Z)
                      </SelectItem>
                      <SelectItem value="desc" className="text-tracksy-blue dark:text-white">
                        Descending (Z-A)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-tracksy-gold/20 hover:bg-tracksy-gold/5 dark:border-tracksy-gold/10 dark:hover:bg-tracksy-gold/10">
                  <TableHead
                    className="cursor-pointer text-tracksy-blue hover:bg-tracksy-gold/10 dark:text-tracksy-gold/90 dark:hover:bg-tracksy-gold/20"
                    onClick={() => handleSortChange("title")}
                  >
                    <div className="flex items-center gap-2">
                      Title
                      {sortField === "title" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-tracksy-blue hover:bg-tracksy-gold/10 dark:text-tracksy-gold/90 dark:hover:bg-tracksy-gold/20"
                    onClick={() => handleSortChange("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-tracksy-blue hover:bg-tracksy-gold/10 dark:text-tracksy-gold/90 dark:hover:bg-tracksy-gold/20"
                    onClick={() => handleSortChange("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      {sortField === "createdAt" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-tracksy-blue dark:text-tracksy-gold/90">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      {hasActiveFilters ? "No tasks match your filters" : "No tasks found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const column = board.columns.find((col) => col.id === item.columnId);

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-tracksy-gold/5 dark:border-tracksy-gold/10 dark:hover:bg-tracksy-gold/10"
                      >
                        <TableCell className="font-medium text-tracksy-blue dark:text-white">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.columnId}
                            onValueChange={(columnId) => handleStatusChange(item.id, columnId)}
                          >
                            <SelectTrigger className="w-full border-tracksy-gold/30 bg-white text-tracksy-blue hover:border-tracksy-gold/50 dark:border-tracksy-gold/20 dark:bg-gray-800 dark:text-white dark:hover:border-tracksy-gold/40">
                              <SelectValue placeholder={column?.name || "No Status"} />
                            </SelectTrigger>
                            <SelectContent className="border-tracksy-gold/30 bg-white dark:border-tracksy-gold/20 dark:bg-gray-800">
                              {board.columns.map((col) => (
                                <SelectItem
                                  key={col.id}
                                  value={col.id}
                                  className="text-tracksy-blue hover:bg-tracksy-gold/5 dark:text-white dark:hover:bg-tracksy-gold/10"
                                >
                                  {col.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground dark:text-gray-300">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          {item.content ? (
                            <div
                              className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-foreground prose-blockquote:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:text-foreground prose-ol:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:text-gray-300 dark:prose-headings:text-white dark:prose-p:text-white dark:prose-blockquote:text-white dark:prose-strong:text-white dark:prose-em:text-white dark:prose-code:text-white dark:prose-pre:text-white dark:prose-ol:text-white dark:prose-ul:text-white dark:prose-li:text-white"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                          ) : (
                            <span className="italic text-muted-foreground dark:text-gray-400">
                              No description
                            </span>
                          )}
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
    </div>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Loader } from "@/components/Loader";
import { useQuery, useSuspenseQuery, useMutation } from "@tanstack/react-query";
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
import { LayoutGrid, List, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
import { getBoard, getBoards, createBoard } from "@/services/board";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  hourlyRate: z.number().optional(),
  currency: z.string().optional(),
});

export function ProjectsPage() {
  const [selectedBoardId, setSelectedBoardId] = useAtom(selectedBoardIdAtom);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: "#e0e0e0",
      hourlyRate: undefined,
      currency: "USD",
    },
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["board", selectedBoardId],
    queryFn: () => getBoard(selectedBoardId ?? ""),
    enabled: !!selectedBoardId,
  });

  const { data: boards, isLoading: boardsLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });

  const createBoardMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      form.reset();
      setOpen(false);
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const boardId = crypto.randomUUID();
    await createBoardMutation.mutateAsync({
      id: boardId,
      name: values.name.trim(),
      color: values.color,
      hourly_rate: values.hourlyRate,
      currency: values.currency,
    });
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
                  const column = board.columns.find((col) => col.id === item.column_id);

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-tracksy-gold/20 bg-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-tracksy-blue">Create New Board</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new board to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-tracksy-blue">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter board name"
                        className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-tracksy-blue">Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional hourly rate"
                        className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-tracksy-blue">Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-tracksy-gold/30 focus:border-tracksy-gold focus:ring-tracksy-gold/20">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-tracksy-gold/30 hover:bg-tracksy-gold/10 hover:text-tracksy-blue"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-tracksy-gold text-white hover:bg-tracksy-gold/90"
                >
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

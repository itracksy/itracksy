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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent>
              {boards?.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="new" onSelect={() => setOpen(true)}>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
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
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>

                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.items.map((item) => {
                const column = board.columns.find((col) => col.id === item.column_id);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{column?.name || "No Status"}</TableCell>

                    <TableCell className="max-w-md truncate">
                      {item.content || "No description"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Add a new board to organize your projects.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter board name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional hourly rate"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

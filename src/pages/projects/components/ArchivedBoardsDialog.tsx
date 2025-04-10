import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useArchiveBoardMutation } from "@/hooks/useBoardQueries";
import { useQueryClient } from "@tanstack/react-query";

interface ArchivedBoardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivedBoards: Array<{
    id: string;
    name: string;
    color: string | null;
    deletedAt: number | null;
  }>;
}

export function ArchivedBoardsDialog({
  open,
  onOpenChange,
  archivedBoards,
}: ArchivedBoardsDialogProps) {
  const [restoringBoardId, setRestoringBoardId] = useState<string | null>(null);
  const archiveBoardMutation = useArchiveBoardMutation();
  const queryClient = useQueryClient();

  const handleUnarchive = async (boardId: string) => {
    setRestoringBoardId(boardId);

    try {
      await archiveBoardMutation.mutateAsync({
        id: boardId,
        archive: false,
      });

      // Refresh the boards list
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    } finally {
      setRestoringBoardId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-tracksy-gold/20 bg-background dark:border-tracksy-gold/10 dark:bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-tracksy-blue dark:text-tracksy-gold">
            Archived Boards
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            View and restore your archived boards.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {archivedBoards.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No archived boards found.</div>
          ) : (
            <div className="space-y-2">
              {archivedBoards.map((board) => (
                <div
                  key={board.id}
                  className="flex items-center justify-between rounded-md border border-tracksy-gold/20 bg-white/50 p-3 dark:border-tracksy-gold/10 dark:bg-gray-900/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: board.color || "#e0e0e0" }}
                    />
                    <span className="font-medium text-tracksy-blue dark:text-white">
                      {board.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnarchive(board.id)}
                    disabled={restoringBoardId === board.id}
                    className="border-tracksy-gold/30 text-green-600 hover:bg-tracksy-gold/10 hover:text-green-700 dark:border-tracksy-gold/20 dark:hover:bg-tracksy-gold/20"
                  >
                    <ArchiveRestore className="mr-1 h-4 w-4" />
                    {restoringBoardId === board.id ? "Restoring..." : "Restore"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCreateTimeEntryMutation } from "@/hooks/useTimeEntryQueries";
import { useToast } from "@/hooks/use-toast";
import { useAtom, useAtomValue } from "jotai";
import { selectedBoardIdAtom, selectedItemIdAtom } from "@/context/board";
import { Calendar, Clock, Plus, FolderKanban, FileText, Timer, CheckCircle2 } from "lucide-react";
import { BoardSelector } from "./BoardSelector";

interface ManualFocusEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} minutes`;
  return minutes === 0 ? `${hours} hours` : `${hours}h ${minutes}m`;
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ManualFocusEntryDialog({ open, onOpenChange }: ManualFocusEntryDialogProps) {
  const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
  const selectedBoardId = useAtomValue(selectedBoardIdAtom);
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [startTime, setStartTime] = useState(formatDateTimeLocal(oneHourAgo));
  const [endTime, setEndTime] = useState(formatDateTimeLocal(now));
  const [description, setDescription] = useState("");

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const durationSeconds = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
  const isValidDuration = durationSeconds > 0 && durationSeconds <= 24 * 60 * 60;

  const handleSubmit = async () => {
    if (!selectedItemId || !selectedBoardId) {
      toast({
        title: "Error",
        description: "Please select a task to add time for",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDuration) {
      toast({
        title: "Error",
        description: "End time must be after start time (max 24 hours)",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        itemId: selectedItemId,
        boardId: selectedBoardId,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        isFocusMode: true,
        description: description.trim() || undefined,
      });

      toast({
        title: "Focus time added",
        description: `Added ${formatDuration(durationSeconds)} of focus time`,
      });

      setDescription("");
      setSelectedItemId("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to add focus time",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setStartTime(formatDateTimeLocal(oneHourAgo));
      setEndTime(formatDateTimeLocal(now));
      setDescription("");
    }
    onOpenChange(isOpen);
  };

  const isFormValid = selectedItemId && selectedBoardId && isValidDuration;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5A853]/10">
              <Plus className="h-5 w-5 text-[#E5A853]" />
            </div>
            Add Focus Time Manually
          </DialogTitle>
          <DialogDescription>
            Record focus time for work completed outside of tracked sessions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section: Task Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-[#2B4474]" />
              <h3 className="text-sm font-semibold text-[#2B4474] dark:text-white">
                Task Selection
              </h3>
            </div>
            <div className="rounded-lg border border-[#E5A853]/20 bg-[#2B4474]/5 p-4 dark:bg-[#2B4474]/10">
              <BoardSelector selectedItemId={selectedItemId} onItemSelect={setSelectedItemId} />
            </div>
          </div>

          <Separator className="bg-[#E5A853]/20" />

          {/* Section: Time & Duration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-[#2B4474]" />
              <h3 className="text-sm font-semibold text-[#2B4474] dark:text-white">
                Time & Duration
              </h3>
            </div>

            <div className="rounded-lg border border-[#E5A853]/20 bg-[#2B4474]/5 p-4 dark:bg-[#2B4474]/10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border-[#E5A853]/30 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-red-500" />
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border-[#E5A853]/30 bg-background"
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="mt-4">
                {isValidDuration ? (
                  <div className="flex items-center justify-between rounded-lg bg-[#E5A853]/10 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-muted-foreground">Calculated Duration</span>
                    </div>
                    <span className="text-lg font-bold text-[#E5A853]">
                      {formatDuration(durationSeconds)}
                    </span>
                  </div>
                ) : startTime && endTime ? (
                  <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                    {durationSeconds <= 0
                      ? "End time must be after start time"
                      : "Duration cannot exceed 24 hours"}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <Separator className="bg-[#E5A853]/20" />

          {/* Section: Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2B4474]" />
              <h3 className="text-sm font-semibold text-[#2B4474] dark:text-white">Notes</h3>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>

            <div className="rounded-lg border border-[#E5A853]/20 bg-[#2B4474]/5 p-4 dark:bg-[#2B4474]/10">
              <Textarea
                id="description"
                placeholder="What did you work on? Add any notes about this focus session..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none border-[#E5A853]/30 bg-background"
              />
            </div>
          </div>

          {/* Summary Card */}
          {isFormValid && (
            <>
              <Separator className="bg-[#E5A853]/20" />
              <div className="rounded-lg border-2 border-[#E5A853]/30 bg-[#E5A853]/5 p-4">
                <h4 className="mb-3 text-sm font-semibold text-[#2B4474] dark:text-white">
                  Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{formatDateDisplay(startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">{formatDateDisplay(endTime)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E5A853]/20 pt-2">
                    <span className="text-muted-foreground">Total Duration:</span>
                    <span className="font-bold text-[#E5A853]">
                      {formatDuration(durationSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || createTimeEntry.isPending}
              className="gap-2 bg-[#E5A853] px-6 hover:bg-[#d99a3d]"
            >
              <Plus className="h-4 w-4" />
              {createTimeEntry.isPending ? "Adding..." : "Add Focus Time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

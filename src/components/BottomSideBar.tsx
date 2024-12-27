import { useState, useEffect } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
} from "@/services/hooks/useTimeEntryQueries";
import { Clock, PlayCircle, StopCircle } from "lucide-react";

import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAtomValue } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";

export function BottomSideBar() {
  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [duration, setDuration] = useState<string>("00:00:00");
  const selectedBoardId = useAtomValue(selectedBoardIdAtom);

  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const createTimeEntry = useCreateTimeEntryMutation();
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTimeEntry?.start) {
      const updateDuration = () => {
        const start = new Date(activeTimeEntry.start).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setDuration(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      // Update immediately
      updateDuration();
      // Then update every second
      intervalId = setInterval(updateDuration, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry?.start]);

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        end: new Date().getTime(),
      });

      toast({
        title: "Time Entry Stopped",
        description: "Your time entry has been stopped.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop time entry.",
        variant: "destructive",
      });
    }
  };

  const handleStartTimeEntry = async () => {
    if (activeTimeEntry) return;
    setOpen(true);
  };

  const handleCreateTimeEntry = async () => {
    if (!selectedItemId || !selectedBoardId) return;

    try {
      await createTimeEntry.mutateAsync({
        id: crypto.randomUUID(),
        itemId: selectedItemId,
        boardId: selectedBoardId,
        start: new Date().getTime(),
      });

      toast({
        title: "Time Entry Started",
        description: "New time entry has been started.",
      });
      setOpen(false);
      setSelectedItemId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start time entry.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <>
        {isLoading ? (
          <SidebarMenuButton disabled className="w-full justify-start">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </SidebarMenuButton>
        ) : activeTimeEntry ? (
          <SidebarMenuButton
            onClick={handleStopTimeEntry}
            className="hover:text-red-600"
            tooltip={`Stop: ${activeTimeEntry?.item?.title}`}
          >
            <StopCircle className="h-5 w-5 text-red-600" />
            <span className="flex items-center gap-2 text-sm font-medium">
              <span>Stop: {activeTimeEntry?.item?.title}</span>
              <span className="text-xs text-muted-foreground">({duration})</span>
            </span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton
            onClick={handleStartTimeEntry}
            className="hover:text-green-600"
            tooltip="Start new time entry"
          >
            <PlayCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Start new time entry</span>
          </SidebarMenuButton>
        )}
      </>

      <TimeEntryDialog
        open={open}
        onOpenChange={setOpen}
        selectedItemId={selectedItemId}
        setSelectedItemId={setSelectedItemId}
        onCreateTimeEntry={handleCreateTimeEntry}
      />
    </>
  );
}

import { useState, useEffect } from "react";
import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
  useCreateTimeEntryMutation,
} from "@/hooks/useTimeEntryQueries";
import { Clock, PlayCircle, StopCircle, Focus } from "lucide-react";

import { TimeEntryDialog } from "@/components/tracking/TimeEntryDialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAtomValue } from "jotai";
import { selectedBoardIdAtom } from "@/context/board";
import { trpcClient } from "@/utils/trpc";

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

    if (activeTimeEntry?.start_time) {
      const updateDuration = () => {
        const start = new Date(activeTimeEntry.start_time).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const durationLocal =
          hours > 0
            ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        setDuration(durationLocal);

        const text = activeTimeEntry.items?.title;
        const trayTitle = text.length > 10 ? `${text.slice(0, 7)}...` : text;

        window.electronWindow.updateTrayTitle(`${trayTitle}-${durationLocal}`);
      };

      // Update immediately
      updateDuration();
      // Then update every second
      intervalId = setInterval(updateDuration, 1000);
    } else {
      window.electronWindow.updateTrayTitle("iTracksy");
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimeEntry?.start_time]);

  const handleStopTimeEntry = async () => {
    if (!activeTimeEntry) return;

    try {
      await updateTimeEntry.mutateAsync({
        id: activeTimeEntry.id,
        end_time: new Date().toISOString(),
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
    if (activeTimeEntry) {
      return;
    }
    setOpen(true);
  };

  const handleCreateTimeEntry = async (isFocusMode: boolean) => {
    if (!selectedItemId || !selectedBoardId) {
      return;
    }

    try {
      await createTimeEntry.mutateAsync({
        id: crypto.randomUUID(),
        item_id: selectedItemId,
        board_id: selectedBoardId,
        start_time: new Date().toISOString(),
        is_focus_mode: isFocusMode,
      });
      trpcClient.user.updateActivitySettings.mutate({
        currentTaskId: selectedItemId,
        isFocusMode,
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
            tooltip={`Stop: ${activeTimeEntry?.items?.title}`}
          >
            <StopCircle className="h-6 w-6 text-red-600" />
            <span className="flex items-center gap-2 text-base font-medium">
              <span>{activeTimeEntry?.items?.title}</span>

              <span className="text-xs text-muted-foreground">({duration})</span>
              <span>
                {activeTimeEntry.is_focus_mode && <Focus className="h-4 w-4 text-red-600" />}
              </span>
            </span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton
            onClick={handleStartTimeEntry}
            className="hover:text-green-600"
            tooltip="Start new time entry"
          >
            <PlayCircle className="h-6 w-6 text-green-600" />
            <span className="text-base text-muted-foreground">Start new time entry</span>
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

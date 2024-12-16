import {
  useActiveTimeEntry,
  useUpdateTimeEntryMutation,
} from "@/services/hooks/useTimeEntryQueries";
import { Clock, PlayCircle, StopCircle } from "lucide-react";
import { TrackingControls } from "@/components/tracking/TrackingControls";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

export function BottomSideBar() {
  const { data: activeTimeEntry, isLoading } = useActiveTimeEntry();
  const updateTimeEntry = useUpdateTimeEntryMutation();
  const { toast } = useToast();

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

    try {
      // await updateTimeEntry.mutateAsync({
      //   description: "New Time Entry",
      //   start: new Date().getTime(),
      // });

      toast({
        title: "Time Entry Started",
        description: "New time entry has been started.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start time entry.",
        variant: "destructive",
      });
    }
  };
  console.log("activeTimeEntry", activeTimeEntry);
  return (
    <>
      <TrackingControls />
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
            <span className="text-sm font-medium">Stop: {activeTimeEntry?.item?.title}</span>
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
    </>
  );
}

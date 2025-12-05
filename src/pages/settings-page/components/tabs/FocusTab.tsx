import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { UserPreferences } from "@/lib/types/user-preferences";

interface FocusTabProps {
  preferences: UserPreferences;
  updatePreferences: (updates: any) => Promise<void>;
}

export function FocusTab({ preferences, updatePreferences }: FocusTabProps) {
  const queryClient = useQueryClient();

  const { data: activitySettings = null } = useQuery({
    queryKey: ["user.getActivitySettings"],
    queryFn: async () => {
      const data = await trpcClient.user.getActivitySettings.query();
      return data;
    },
  });

  const onFocusChange = async () => {
    await trpcClient.user.updateActivitySettings.mutate({
      isWarningPopupEnable: !activitySettings?.isWarningPopupEnable,
    });
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
  };

  const onClockVisibilityChange = async () => {
    const newValue = !activitySettings?.isClockVisible;
    await trpcClient.user.updateActivitySettings.mutate({
      isClockVisible: newValue,
    });
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });

    try {
      await trpcClient.window.setClockVisibility.mutate({ isVisible: newValue });
    } catch (error) {
      console.error("Failed to notify main process about clock visibility change:", error);
    }
  };

  const onTimeExceededNotificationChange = async () => {
    await trpcClient.user.updateActivitySettings.mutate({
      isTimeExceededNotificationEnabled: !activitySettings?.isTimeExceededNotificationEnabled,
    });
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Focus Session Settings</CardTitle>
          <CardDescription>
            Control warnings and notifications during focus sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Warning Pop-up</Label>
              <p className="text-sm text-muted-foreground">
                Show warning pop-up when accessing blocked sites during focus
              </p>
            </div>
            <Switch
              checked={activitySettings?.isWarningPopupEnable}
              onCheckedChange={onFocusChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Clock Window</Label>
              <p className="text-sm text-muted-foreground">
                Show floating clock window when starting focus sessions
              </p>
            </div>
            <Switch
              checked={activitySettings?.isClockVisible}
              onCheckedChange={onClockVisibilityChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Time Exceeded Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notify when focus session exceeds target duration
              </p>
            </div>
            <Switch
              checked={activitySettings?.isTimeExceededNotificationEnabled}
              onCheckedChange={onTimeExceededNotificationChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Durations</CardTitle>
          <CardDescription>Set your preferred focus and break session lengths</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Focus Duration</Label>
              <span className="text-sm text-muted-foreground">
                {preferences.focus.defaultFocusDuration} minutes
              </span>
            </div>
            <Slider
              value={[preferences.focus.defaultFocusDuration]}
              onValueChange={([value]) =>
                updatePreferences({
                  focus: { defaultFocusDuration: value },
                })
              }
              min={5}
              max={120}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Break Duration</Label>
              <span className="text-sm text-muted-foreground">
                {preferences.focus.defaultBreakDuration} minutes
              </span>
            </div>
            <Slider
              value={[preferences.focus.defaultBreakDuration]}
              onValueChange={([value]) =>
                updatePreferences({
                  focus: { defaultBreakDuration: value },
                })
              }
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Behavior</CardTitle>
          <CardDescription>Automate your focus workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Start Breaks</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start break timer after focus session
              </p>
            </div>
            <Switch
              checked={preferences.focus.autoStartBreaks}
              onCheckedChange={(checked) =>
                updatePreferences({
                  focus: { autoStartBreaks: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Start Next Session</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start next focus session after break
              </p>
            </div>
            <Switch
              checked={preferences.focus.autoStartNextSession}
              onCheckedChange={(checked) =>
                updatePreferences({
                  focus: { autoStartNextSession: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distraction Management</CardTitle>
          <CardDescription>Minimize distractions during focus sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dim Inactive Windows</Label>
              <p className="text-sm text-muted-foreground">Reduce opacity of non-focus windows</p>
            </div>
            <Switch
              checked={preferences.focus.dimInactiveWindows}
              onCheckedChange={(checked) =>
                updatePreferences({
                  focus: { dimInactiveWindows: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Hide Distractions</Label>
              <p className="text-sm text-muted-foreground">
                Hide non-essential UI elements during focus
              </p>
            </div>
            <Switch
              checked={preferences.focus.hideDistractions}
              onCheckedChange={(checked) =>
                updatePreferences({
                  focus: { hideDistractions: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

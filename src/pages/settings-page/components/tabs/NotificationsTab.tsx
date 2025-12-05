import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Volume2, Bell } from "lucide-react";
import type { UserPreferences } from "@/lib/types/user-preferences";

interface NotificationsTabProps {
  preferences: UserPreferences;
  updatePreferences: (updates: any) => Promise<void>;
}

export function NotificationsTab({ preferences, updatePreferences }: NotificationsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>Control notification sounds and volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Sounds</Label>
              <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
            </div>
            <Switch
              checked={preferences.notifications.soundEnabled}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { soundEnabled: checked },
                })
              }
            />
          </div>

          {preferences.notifications.soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {preferences.notifications.soundVolume}%
                </span>
              </div>
              <Slider
                value={[preferences.notifications.soundVolume]}
                onValueChange={([value]) =>
                  updatePreferences({
                    notifications: { soundVolume: value },
                  })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show system notifications outside the app
              </p>
            </div>
            <Switch
              checked={preferences.notifications.showDesktopNotifications}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { showDesktopNotifications: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Show notifications within the app</p>
            </div>
            <Switch
              checked={preferences.notifications.showInAppNotifications}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { showInAppNotifications: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Focus Reminders</Label>
              <p className="text-sm text-muted-foreground">Remind you to start focus sessions</p>
            </div>
            <Switch
              checked={preferences.notifications.focusReminders}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { focusReminders: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Break Reminders</Label>
              <p className="text-sm text-muted-foreground">Remind you to take breaks</p>
            </div>
            <Switch
              checked={preferences.notifications.breakReminders}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { breakReminders: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Goal Achievements</Label>
              <p className="text-sm text-muted-foreground">Celebrate when you reach goals</p>
            </div>
            <Switch
              checked={preferences.notifications.goalAchievements}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { goalAchievements: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

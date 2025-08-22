import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";

import { setTheme, getCurrentTheme } from "../../helpers/theme_helpers";
import { ThemeMode } from "@/lib/types/theme-mode";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";
import { AboutSection } from "@/pages/settings-page/components/AboutSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [newApp, setNewApp] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    type: "domain" | "app";
    index: number;
  } | null>(null);

  const { data: blockedDomains = [] } = useQuery({
    queryKey: ["user.getBlockedDomains"],
    queryFn: async () => {
      const data = await trpcClient.user.getBlockedDomains.query();
      return data;
    },
  });
  const { data: blockedApps = [] } = useQuery({
    queryKey: ["user.getBlockedApps"],
    queryFn: async () => {
      const data = await trpcClient.user.getBlockedApps.query();
      return data;
    },
  });
  const { data: activitySettings = null } = useQuery({
    queryKey: ["user.getActivitySettings"],
    queryFn: async () => {
      const data = await trpcClient.user.getActivitySettings.query();
      return data;
    },
  });
  const { data: permissions = null } = useQuery({
    queryKey: ["user.getPermissions"],
    queryFn: async () => {
      const data = await trpcClient.user.getPermissions.query();
      return data;
    },
  });

  const { data: detailedPermissions = null } = useQuery({
    queryKey: ["user.getDetailedPermissionStatus"],
    queryFn: async () => {
      const data = await trpcClient.user.getDetailedPermissionStatus.query();
      return data;
    },
  });

  const { data: autoStartStatus = null } = useQuery({
    queryKey: ["autoStart.getStatus"],
    queryFn: async () => {
      const data = await trpcClient.autoStart.getStatus.query();
      return data;
    },
  });

  const { data: autoStartInfo = null } = useQuery({
    queryKey: ["autoStart.getInfo"],
    queryFn: async () => {
      const data = await trpcClient.autoStart.getInfo.query();
      return data;
    },
  });

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

  const handleThemeChange = async (theme: ThemeMode) => {
    await setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleAddDomain = async () => {
    if (newDomain.trim()) {
      await trpcClient.user.addBlockedDomain.mutate(newDomain.trim());
      queryClient.invalidateQueries({ queryKey: ["user.getBlockedDomains"] });
      setNewDomain("");
    }
  };

  const handleRemoveDomain = async (index: number) => {
    await trpcClient.user.removeBlockedDomain.mutate(blockedDomains[index].domain);
    queryClient.invalidateQueries({ queryKey: ["user.getBlockedDomains"] });
    setItemToDelete(null);
  };

  const handleAddApp = async () => {
    if (newApp.trim()) {
      await trpcClient.user.addBlockedApp.mutate(newApp.trim());
      queryClient.invalidateQueries({ queryKey: ["user.getBlockedApps"] });
      setNewApp("");
    }
  };

  const handleRemoveApp = async (index: number) => {
    await trpcClient.user.removeBlockedApp.mutate(blockedApps[index].appName);
    queryClient.invalidateQueries({ queryKey: ["user.getBlockedApps"] });
    setItemToDelete(null);
  };

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

    // Notify the main process about the setting change
    if ((window as any).electronWindow) {
      try {
        await (window as any).electronWindow.handleClockVisibilityChange(newValue);
      } catch (error) {
        console.error("Failed to notify main process about clock visibility change:", error);
      }
    }
  };

  const onTimeExceededNotificationChange = async () => {
    await trpcClient.user.updateActivitySettings.mutate({
      isTimeExceededNotificationEnabled: !activitySettings?.isTimeExceededNotificationEnabled,
    });
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
  };

  const onAutoStartChange = async () => {
    try {
      const newValue = !autoStartStatus?.openAtLogin;
      await trpcClient.autoStart.setEnabled.mutate({
        enabled: newValue,
        openAsHidden: false, // Start visible by default
      });
      queryClient.invalidateQueries({ queryKey: ["autoStart.getStatus"] });
      queryClient.invalidateQueries({ queryKey: ["autoStart.getInfo"] });
    } catch (error) {
      console.error("Failed to toggle auto-start:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {itemToDelete && (
        <AlertDialog
          open={itemToDelete !== null}
          onOpenChange={(open) => !open && setItemToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the {itemToDelete.type === "domain" ? "domain" : "app"}:{" "}
                {itemToDelete.type === "domain"
                  ? blockedDomains[itemToDelete.index].domain
                  : blockedApps[itemToDelete.index].appName}{" "}
                from your blocked list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (itemToDelete.type === "domain") {
                    handleRemoveDomain(itemToDelete.index);
                  } else if (itemToDelete?.type === "app") {
                    handleRemoveApp(itemToDelete.index);
                  }
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-muted-foreground">Configure your application settings</p>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Customize your application appearance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button
            variant={currentTheme === "light" ? "default" : "outline"}
            size="icon"
            onClick={() => handleThemeChange("light")}
          >
            <SunIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTheme === "dark" ? "default" : "outline"}
            size="icon"
            onClick={() => handleThemeChange("dark")}
          >
            <MoonIcon className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warning Pop-up</CardTitle>
          <CardDescription>
            Enabling Focus Mode will show a warning pop-up when you are in a focus session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={activitySettings?.isWarningPopupEnable}
            onCheckedChange={onFocusChange}
            id="focus-mode"
          />
          <label htmlFor="focus-mode">Enable Warning Pop-up</label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clock Window</CardTitle>
          <CardDescription>
            Control whether the floating clock window appears automatically when you start a focus
            session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={activitySettings?.isClockVisible}
            onCheckedChange={onClockVisibilityChange}
            id="clock-visibility"
          />
          <label htmlFor="clock-visibility">Show clock window when starting focus sessions</label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Exceeded Notifications</CardTitle>
          <CardDescription>
            Control whether to receive notifications when your focus session time exceeds the target
            duration. Disable this to avoid interruptions during extended focus sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={activitySettings?.isTimeExceededNotificationEnabled}
            onCheckedChange={onTimeExceededNotificationChange}
            id="time-exceeded-notifications"
          />
          <label htmlFor="time-exceeded-notifications">
            Show notifications when time is exceeded
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Start on System Boot</CardTitle>
          <CardDescription>
            Launch iTracksy automatically when your system starts up. {autoStartInfo?.platform === "win32" 
              ? "On Windows, this is managed through the Windows Registry."
              : autoStartInfo?.platform === "darwin"
              ? "On macOS, this adds iTracksy to your Login Items."
              : autoStartInfo?.platform === "linux"
              ? "On Linux, this creates an autostart desktop entry."
              : "Platform-specific auto-start functionality."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={autoStartStatus?.openAtLogin || false}
            onCheckedChange={onAutoStartChange}
            id="auto-start"
            disabled={!autoStartInfo?.supported}
          />
          <label htmlFor="auto-start" className={!autoStartInfo?.supported ? "text-muted-foreground" : ""}>
            {autoStartInfo?.supported 
              ? "Start iTracksy automatically when system boots"
              : `Auto-start not supported on ${autoStartInfo?.platform || "this platform"}`
            }
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
          <CardDescription>
            {detailedPermissions?.platform === "darwin"
              ? "macOS permissions required for browser URL tracking and detailed activity monitoring"
              : "System access permissions for time tracking"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailedPermissions?.platform === "darwin" && !detailedPermissions.allGranted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-amber-600 dark:text-amber-400">⚠️</div>
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-amber-800 dark:text-amber-200">
                    Permissions Required
                  </h4>
                  <p className="mb-2 text-sm text-amber-700 dark:text-amber-300">
                    Some features are limited without proper macOS permissions. Browser URL tracking
                    requires both permissions below.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Restart iTracksy after granting permissions for changes to take effect.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Accessibility Permission</Label>
                {detailedPermissions?.accessibility.granted && (
                  <span className="text-sm text-green-600">✓</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {detailedPermissions?.accessibility.description ||
                  "Required to track active applications"}
              </p>
              {detailedPermissions?.platform === "darwin" && (
                <p className="text-xs text-muted-foreground">
                  Grant in: {detailedPermissions.accessibility.systemPreferencesPath}
                </p>
              )}
            </div>
            <Switch
              disabled={permissions?.accessibilityPermission === true}
              checked={permissions?.accessibilityPermission}
              onCheckedChange={async (checked) => {
                await trpcClient.user.setPermissions.mutate({
                  accessibilityPermission: checked,
                });
                queryClient.invalidateQueries({ queryKey: ["user.getPermissions"] });
                queryClient.invalidateQueries({ queryKey: ["user.getDetailedPermissionStatus"] });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Screen Recording Permission</Label>
                {detailedPermissions?.screenRecording.granted && (
                  <span className="text-sm text-green-600">✓</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {detailedPermissions?.screenRecording.description ||
                  "Required to track browser activity"}
              </p>
              {detailedPermissions?.platform === "darwin" && (
                <p className="text-xs text-muted-foreground">
                  Grant in: {detailedPermissions.screenRecording.systemPreferencesPath}
                </p>
              )}
            </div>
            <Switch
              disabled={permissions?.screenRecordingPermission === true}
              checked={permissions?.screenRecordingPermission}
              onCheckedChange={async (checked) => {
                await trpcClient.user.setPermissions.mutate({
                  screenRecordingPermission: checked,
                });
                queryClient.invalidateQueries({ queryKey: ["user.getPermissions"] });
                queryClient.invalidateQueries({ queryKey: ["user.getDetailedPermissionStatus"] });
              }}
            />
          </div>

          {detailedPermissions?.platform === "darwin" && detailedPermissions.allGranted && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <div className="text-green-600 dark:text-green-400">✓</div>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    All Permissions Granted
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    iTracksy can now track browser URLs and provide detailed activity insights.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AboutSection />
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Info } from "lucide-react";

export function SystemTab() {
  const queryClient = useQueryClient();

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

  const onAutoStartChange = async () => {
    try {
      const newValue = !autoStartStatus?.openAtLogin;
      await trpcClient.autoStart.setEnabled.mutate({
        enabled: newValue,
        openAsHidden: false,
      });
      queryClient.invalidateQueries({ queryKey: ["autoStart.getStatus"] });
      queryClient.invalidateQueries({ queryKey: ["autoStart.getInfo"] });
    } catch (error) {
      console.error("Failed to toggle auto-start:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-Start on System Boot
          </CardTitle>
          <CardDescription>
            Launch iTracksy automatically when your system starts up.{" "}
            {autoStartInfo?.platform === "win32"
              ? "On Windows, this is managed through the Windows Registry."
              : autoStartInfo?.platform === "darwin"
                ? "On macOS, this adds iTracksy to your Login Items."
                : autoStartInfo?.platform === "linux"
                  ? "On Linux, this creates an autostart desktop entry."
                  : "Platform-specific auto-start functionality."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="auto-start"
              className={!autoStartInfo?.supported ? "text-muted-foreground" : ""}
            >
              {autoStartInfo?.supported
                ? "Start iTracksy automatically when system boots"
                : `Auto-start not supported on ${autoStartInfo?.platform || "this platform"}`}
            </Label>
            <Switch
              id="auto-start"
              checked={autoStartStatus?.openAtLogin || false}
              onCheckedChange={onAutoStartChange}
              disabled={!autoStartInfo?.supported}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Permissions
          </CardTitle>
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
                queryClient.invalidateQueries({
                  queryKey: ["user.getDetailedPermissionStatus"],
                });
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
                queryClient.invalidateQueries({
                  queryKey: ["user.getDetailedPermissionStatus"],
                });
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

      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Developer tools and debugging options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Ghost Windows</Label>
              <p className="text-sm text-muted-foreground">
                Identify and highlight invisible windows that might be blocking interactions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await trpcClient.window.debugGhostWindows.mutate();
              }}
            >
              Run Debugger
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

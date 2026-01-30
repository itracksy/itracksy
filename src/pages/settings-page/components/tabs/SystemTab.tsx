import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpcClient } from "@/utils/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Shield, RefreshCw, AlertTriangle } from "lucide-react";

export function SystemTab() {
  const queryClient = useQueryClient();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Listen for permission errors from main process
  useEffect(() => {
    const cleanup = window.electronPermission?.onPermissionError((data) => {
      console.log("[SystemTab] Received permission error:", data);
      setPermissionError(data.message);
      // Invalidate permission queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["user.getVerifiedPermissionStatus"] });
    });

    return () => {
      cleanup?.();
    };
  }, [queryClient]);

  const { data: permissions = null } = useQuery({
    queryKey: ["user.getPermissions"],
    queryFn: async () => {
      const data = await trpcClient.user.getPermissions.query();
      return data;
    },
  });

  // Use verified permission status for more accurate results
  const {
    data: verifiedPermissions = null,
    isLoading: isVerifying,
    refetch: refetchVerified,
  } = useQuery({
    queryKey: ["user.getVerifiedPermissionStatus"],
    queryFn: async () => {
      const data = await trpcClient.user.getVerifiedPermissionStatus.query();
      console.log("[SystemTab] Verified permission status:", data);
      return data;
    },
    // Refetch every 30 seconds to catch permission changes
    refetchInterval: 30000,
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

  const { data: isDevelopment = false } = useQuery({
    queryKey: ["utils.isDevelopment"],
    queryFn: async () => {
      return trpcClient.utils.isDevelopment.query();
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

  const handleRefreshPermissions = async () => {
    setPermissionError(null);
    await trpcClient.user.resetPermissionCache.mutate();
    await refetchVerified();
  };

  // Check if system reports granted but verification failed
  const hasPermissionMismatch =
    verifiedPermissions?.screenRecording.granted && !verifiedPermissions?.screenRecording.verified;

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
            {verifiedPermissions?.platform === "darwin"
              ? "macOS permissions required for browser URL tracking and detailed activity monitoring"
              : "System access permissions for time tracking"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission error from tracking - most critical warning */}
          {(permissionError || hasPermissionMismatch) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-red-800 dark:text-red-200">
                    Permission Not Working
                  </h4>
                  <p className="mb-2 text-sm text-red-700 dark:text-red-300">
                    {permissionError ||
                      "macOS reports permission as granted, but activity tracking cannot access window information. This can happen after app updates or permission changes."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Try: System Settings → Privacy & Security → Screen Recording → Toggle OFF then
                      ON for iTracksy, then restart the app.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPermissions}
                      disabled={isVerifying}
                      className="ml-auto"
                    >
                      <RefreshCw className={`mr-1 h-3 w-3 ${isVerifying ? "animate-spin" : ""}`} />
                      Re-check
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard permission required warning */}
          {verifiedPermissions?.platform === "darwin" &&
            !verifiedPermissions.allGranted &&
            !hasPermissionMismatch &&
            !permissionError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-600 dark:text-amber-400">⚠️</div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-amber-800 dark:text-amber-200">
                      Permissions Required
                    </h4>
                    <p className="mb-2 text-sm text-amber-700 dark:text-amber-300">
                      Some features are limited without proper macOS permissions. Browser URL
                      tracking requires both permissions below.
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
                {verifiedPermissions?.accessibility.granted && (
                  <span className="text-sm text-green-600">✓</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {verifiedPermissions?.accessibility.description ||
                  "Required to track active applications"}
              </p>
              {verifiedPermissions?.platform === "darwin" && (
                <p className="text-xs text-muted-foreground">
                  Grant in: {verifiedPermissions.accessibility.systemPreferencesPath}
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
                // Reset cache so next verification is fresh
                await trpcClient.user.resetPermissionCache.mutate();
                queryClient.invalidateQueries({ queryKey: ["user.getPermissions"] });
                queryClient.invalidateQueries({
                  queryKey: ["user.getVerifiedPermissionStatus"],
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Screen Recording Permission</Label>
                {verifiedPermissions?.screenRecording.verified ? (
                  <span className="text-sm text-green-600">✓</span>
                ) : verifiedPermissions?.screenRecording.granted ? (
                  <span
                    className="text-sm text-amber-600"
                    title="System reports granted but not working"
                  >
                    ⚠️
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {verifiedPermissions?.screenRecording.description ||
                  "Required to track browser activity"}
              </p>
              {verifiedPermissions?.platform === "darwin" && (
                <p className="text-xs text-muted-foreground">
                  Grant in: {verifiedPermissions.screenRecording.systemPreferencesPath}
                </p>
              )}
              {hasPermissionMismatch && (
                <p className="text-xs text-red-600">
                  System reports granted but verification failed - try toggling permission off/on
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
                // Reset cache so next verification is fresh
                await trpcClient.user.resetPermissionCache.mutate();
                queryClient.invalidateQueries({ queryKey: ["user.getPermissions"] });
                queryClient.invalidateQueries({
                  queryKey: ["user.getVerifiedPermissionStatus"],
                });
              }}
            />
          </div>

          {verifiedPermissions?.platform === "darwin" &&
            verifiedPermissions.allGranted &&
            !hasPermissionMismatch &&
            !permissionError && (
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

      {isDevelopment && (
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
      )}
    </div>
  );
}

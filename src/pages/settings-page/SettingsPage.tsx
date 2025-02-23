import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useAtom } from "jotai";

import { setTheme, getCurrentTheme } from "../../helpers/theme_helpers";
import { ThemeMode } from "@/lib/types/theme-mode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useTracking } from "@/hooks/useTracking";
import { PlayCircle, StopCircle } from "lucide-react";
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
  const { isTracking, startTracking, stopTracking } = useTracking();
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
      isFocusMode: !activitySettings?.isFocusMode,
    });
    queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
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
          <CardTitle>Focus Mode</CardTitle>
          <CardDescription>Control your focus mode settings</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={activitySettings?.isFocusMode}
            onCheckedChange={onFocusChange}
            id="focus-mode"
          />
          <label htmlFor="focus-mode">Enable Focus Mode</label>

          <Button
            variant={isTracking ? "destructive" : "default"}
            size="icon"
            onClick={isTracking ? stopTracking : startTracking}
            className="h-6 w-6"
          >
            {isTracking ? <StopCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
          <CardDescription>
            Manage system access permissions required for time tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Accessibility Permission</Label>
              <p className="text-sm text-muted-foreground">Required to track active applications</p>
            </div>
            <Switch
              checked={activitySettings?.accessibilityPermission}
              onCheckedChange={async (checked) => {
                await trpcClient.user.updateActivitySettings.mutate({
                  accessibilityPermission: checked,
                });
                queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Screen Recording Permission</Label>
              <p className="text-sm text-muted-foreground">Required to track browser activity</p>
            </div>
            <Switch
              checked={activitySettings?.screenRecordingPermission}
              onCheckedChange={async (checked) => {
                await trpcClient.user.updateActivitySettings.mutate({
                  screenRecordingPermission: checked,
                });
                queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Domains</CardTitle>
          <CardDescription>Manage websites you want to block during focus mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter domain to block"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            />
            <Button onClick={handleAddDomain}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockedDomains.map(({ domain }, index) => (
              <Badge key={domain} variant="secondary" className="text-sm">
                {domain}
                <Cross2Icon
                  className="ml-2 h-3 w-3 cursor-pointer"
                  onClick={() => setItemToDelete({ type: "domain", index })}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Applications</CardTitle>
          <CardDescription>Manage applications you want to block during focus mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter app name to block"
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddApp()}
            />
            <Button onClick={handleAddApp}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockedApps.map(({ appName }, index) => (
              <Badge key={appName} variant="secondary" className="text-sm">
                {appName}
                <Cross2Icon
                  className="ml-2 h-3 w-3 cursor-pointer"
                  onClick={() => setItemToDelete({ type: "app", index })}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <AboutSection />
    </div>
  );
}

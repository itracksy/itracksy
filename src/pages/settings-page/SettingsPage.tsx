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
      isFocusMode: !activitySettings?.isBlockingOnFocusMode,
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
          <CardTitle>Warning Pop-up</CardTitle>
          <CardDescription>
            Enabling Focus Mode will show a warning pop-up when you are in a focus session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Switch
            checked={activitySettings?.isBlockingOnFocusMode}
            onCheckedChange={onFocusChange}
            id="focus-mode"
          />
          <label htmlFor="focus-mode">Enable Warning Pop-up</label>
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
              disabled={activitySettings?.accessibilityPermission === true}
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
              disabled={activitySettings?.screenRecordingPermission === true}
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

      <AboutSection />
    </div>
  );
}

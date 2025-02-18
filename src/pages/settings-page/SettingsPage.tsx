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
import { blockedDomainsAtom, blockedAppsAtom, isFocusModeAtom } from "@/context/activity";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");
  const [blockedDomains, setBlockedDomains] = useAtom(blockedDomainsAtom);
  const [blockedApps, setBlockedApps] = useAtom(blockedAppsAtom);
  const [isFocusMode, setIsFocusMode] = useAtom(isFocusModeAtom);
  const [newDomain, setNewDomain] = useState("");
  const [newApp, setNewApp] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    type: "domain" | "app";
    index: number;
  } | null>(null);

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

  useEffect(() => {
    try {
      trpcClient.updateActivitySettings.mutate({
        blockedDomains,
        blockedApps,
        isFocusMode,
      });
    } catch (error) {
      console.error("SettingsPage: Error updating activity settings", error);
    }
  }, [blockedDomains, blockedApps, isFocusMode]);

  const handleThemeChange = async (theme: ThemeMode) => {
    await setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      setBlockedDomains([...blockedDomains, newDomain.trim()]);
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (index: number) => {
    const updated = [...blockedDomains];
    updated.splice(index, 1);
    setBlockedDomains(updated);
    setItemToDelete(null);
  };

  const handleAddApp = () => {
    if (newApp.trim()) {
      setBlockedApps([...blockedApps, newApp.trim()]);
      setNewApp("");
    }
  };

  const handleRemoveApp = (index: number) => {
    const updated = [...blockedApps];
    updated.splice(index, 1);
    setBlockedApps(updated);
    setItemToDelete(null);
  };

  const index = itemToDelete?.index;
  console.log("itemToDelete", itemToDelete);
  return (
    <div className="space-y-6 p-6">
      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the {itemToDelete?.type === "domain" ? "domain" : "app"}{" "}
              {itemToDelete?.type === "domain"
                ? blockedDomains[itemToDelete.index]
                : blockedApps[index ?? 0]}
              from your blocked list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete?.type === "domain") {
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
          <Switch checked={isFocusMode} onCheckedChange={setIsFocusMode} id="focus-mode" />
          <label htmlFor="focus-mode">Enable Focus Mode</label>
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
            {blockedDomains.map((domain, index) => (
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
            {blockedApps.map((app, index) => (
              <Badge key={app} variant="secondary" className="text-sm">
                {app}
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

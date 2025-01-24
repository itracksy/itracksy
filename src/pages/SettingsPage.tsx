import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useAtom } from "jotai";

import { setTheme, getCurrentTheme } from "../helpers/theme_helpers";
import { ThemeMode } from "@/lib/types/theme-mode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AboutSection } from "@/components/settings/AboutSection";
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
import { useTracking } from "@/hooks/useTracking";

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
  const { isTracking, startTracking, stopTracking } = useTracking();
  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

  useEffect(() => {
    if (isTracking) {
      stopTracking();
      startTracking();
    }
  }, [blockedDomains, blockedApps, isTracking, startTracking, stopTracking]);

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
    <div className="p-6">
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

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Theme</h2>
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            className={`rounded-md px-4 py-2 transition-colors ${
              currentTheme === "light"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            onClick={() => handleThemeChange("light")}
          >
            <div className="flex items-center gap-2">
              <SunIcon className="h-4 w-4" />
              Light
            </div>
          </Button>
          <Button
            variant="outline"
            className={`rounded-md px-4 py-2 transition-colors ${
              currentTheme === "dark"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            onClick={() => handleThemeChange("dark")}
          >
            <div className="flex items-center gap-2">
              <MoonIcon className="h-4 w-4" />
              Dark
            </div>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Focus Mode</h2>
        <div className="mt-4 flex items-center space-x-2">
          <Switch id="focus-mode" checked={isFocusMode} onCheckedChange={setIsFocusMode} />
          <label
            htmlFor="focus-mode"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Enable Focus Mode
          </label>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          When enabled, new time entries will start in focus mode by default
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Focus Mode Blocked Domains</h2>
        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter domain to block"
            className="max-w-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newDomain.trim()) {
                handleAddDomain();
              }
            }}
          />
          <Button onClick={handleAddDomain}>Add</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {blockedDomains.map((domain, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
              {domain}
              <button
                onClick={() => setItemToDelete({ type: "domain", index })}
                className="ml-1 rounded-full p-1 hover:bg-secondary-foreground/10"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Focus Mode Blocked Apps</h2>
        <div className="mt-2 flex gap-2">
          <Input
            type="text"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            placeholder="Enter app name to block"
            className="max-w-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newApp.trim()) {
                handleAddApp();
              }
            }}
          />
          <Button onClick={handleAddApp}>Add</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {blockedApps.map((app, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
              {app}
              <button
                onClick={() => setItemToDelete({ type: "app", index })}
                className="ml-1 rounded-full p-1 hover:bg-secondary-foreground/10"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <AboutSection />
    </div>
  );
}

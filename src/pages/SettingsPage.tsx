import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import { useAtom } from "jotai";

import { setTheme, getCurrentTheme } from "../helpers/theme_helpers";
import { ThemeMode } from "@/lib/types/theme-mode";
import { Button } from "@/components/ui/button";
import { blockedDomainsAtom, blockedAppsAtom } from "@/context/activity";

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");
  const [blockedDomains, setBlockedDomains] = useAtom(blockedDomainsAtom);
  const [blockedApps, setBlockedApps] = useAtom(blockedAppsAtom);
  const [newDomain, setNewDomain] = useState("");
  const [newApp, setNewApp] = useState("");

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

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
  };

  return (
    <div className="p-6">
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
        <h2 className="text-xl font-semibold text-foreground">Focus Mode Blocked Domains</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter domain to block"
            className="rounded-md border px-4 py-2"
          />
          <Button onClick={handleAddDomain}>Add</Button>
        </div>
        <ul className="mt-2">
          {blockedDomains.map((domain, index) => (
            <li key={index} className="flex items-center justify-between">
              {domain}
              <Button variant="outline" onClick={() => handleRemoveDomain(index)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Focus Mode Blocked Apps</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            placeholder="Enter app name to block"
            className="rounded-md border px-4 py-2"
          />
          <Button onClick={handleAddApp}>Add</Button>
        </div>
        <ul className="mt-2">
          {blockedApps.map((app, index) => (
            <li key={index} className="flex items-center justify-between">
              {app}
              <Button variant="outline" onClick={() => handleRemoveApp(index)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";

import { setTheme, getCurrentTheme } from "../helpers/theme_helpers";
import { ThemeMode } from "@/lib/types/theme-mode";

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

  const handleThemeChange = async (theme: ThemeMode) => {
    await setTheme(theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-muted-foreground">Configure your application settings</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-foreground">Theme</h2>
        <div className="mt-2 flex gap-2">
          <button
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
          </button>
          <button
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
          </button>
        </div>
      </div>
    </div>
  );
}

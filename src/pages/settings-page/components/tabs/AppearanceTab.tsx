import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type, Maximize2, Zap, Palette, Check } from "lucide-react";
import { setTheme, getCurrentTheme } from "@/helpers/theme_helpers";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import type { UserPreferences, ThemeVariant } from "@/lib/types/user-preferences";
import { THEME_VARIANTS } from "@/lib/types/user-preferences";
import { cn } from "@/lib/utils";

interface AppearanceTabProps {
  preferences: UserPreferences;
  updatePreferences: (updates: any) => Promise<void>;
}

export function AppearanceTab({ preferences, updatePreferences }: AppearanceTabProps) {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      const mode = theme.local || theme.system;
      if (mode === "light" || mode === "dark") {
        setCurrentTheme(mode);
      }
    });
  }, []);

  const handleThemeChange = async (theme: "light" | "dark") => {
    await setTheme(theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="space-y-4">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Mode</CardTitle>
          <CardDescription>Switch between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button
            variant={currentTheme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => handleThemeChange("light")}
            className="flex items-center gap-2"
          >
            <SunIcon className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={currentTheme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => handleThemeChange("dark")}
            className="flex items-center gap-2"
          >
            <MoonIcon className="h-4 w-4" />
            Dark
          </Button>
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Theme
          </CardTitle>
          <CardDescription>Choose a color palette that suits your style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(Object.keys(THEME_VARIANTS) as ThemeVariant[]).map((variant) => {
              const theme = THEME_VARIANTS[variant];
              const isSelected = preferences.appearance.themeVariant === variant;
              return (
                <button
                  key={variant}
                  onClick={() =>
                    updatePreferences({
                      appearance: { themeVariant: variant },
                    })
                  }
                  className={cn(
                    "relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-2 top-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="mb-2 flex gap-1">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>Adjust text size and font for better readability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select
              value={preferences.appearance.fontScale}
              onValueChange={(value) =>
                updatePreferences({
                  appearance: { fontScale: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (14px)</SelectItem>
                <SelectItem value="normal">Normal (16px)</SelectItem>
                <SelectItem value="large">Large (18px)</SelectItem>
                <SelectItem value="x-large">Extra Large (20px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={preferences.appearance.fontFamily || "default"}
              onValueChange={(value) =>
                updatePreferences({
                  appearance: { fontFamily: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (System)</SelectItem>
                <SelectItem value="sans">Sans Serif (Inter)</SelectItem>
                <SelectItem value="mono">Monospace (Code)</SelectItem>
                <SelectItem value="dyslexic">OpenDyslexic (Accessible)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Layout & Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            Layout & Visual Density
          </CardTitle>
          <CardDescription>Control spacing and visual elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>UI Size</Label>
            <Select
              value={preferences.appearance.uiSize}
              onValueChange={(value) =>
                updatePreferences({
                  appearance: { uiSize: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact - More content, less space</SelectItem>
                <SelectItem value="comfortable">Comfortable - Balanced</SelectItem>
                <SelectItem value="spacious">Spacious - Relaxed layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Icons</Label>
              <p className="text-sm text-muted-foreground">Display icons next to menu items</p>
            </div>
            <Switch
              checked={preferences.appearance.showIcons}
              onCheckedChange={(checked) =>
                updatePreferences({
                  appearance: { showIcons: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rounded Corners</Label>
              <p className="text-sm text-muted-foreground">Use rounded corners for UI elements</p>
            </div>
            <Switch
              checked={preferences.appearance.roundedCorners}
              onCheckedChange={(checked) =>
                updatePreferences({
                  appearance: { roundedCorners: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Animations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Animations & Motion
          </CardTitle>
          <CardDescription>Control animation speed and effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Animation Speed</Label>
            <Select
              value={preferences.appearance.showAnimations}
              onValueChange={(value) =>
                updatePreferences({
                  appearance: { showAnimations: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - No animations</SelectItem>
                <SelectItem value="reduced">Reduced - Minimal animations</SelectItem>
                <SelectItem value="normal">Normal - Standard speed</SelectItem>
                <SelectItem value="enhanced">Enhanced - Smooth & fluid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">Minimize animations for accessibility</p>
            </div>
            <Switch
              checked={preferences.appearance.reducedMotion}
              onCheckedChange={(checked) =>
                updatePreferences({
                  appearance: { reducedMotion: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

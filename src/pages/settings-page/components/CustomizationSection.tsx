import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Layout,
  Bell,
  Focus,
  Eye,
  Type,
  Maximize2,
  Zap,
  Volume2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { THEME_VARIANTS, type ThemeVariant, type SidebarItem } from "@/lib/types/user-preferences";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS: { id: SidebarItem; label: string; description: string }[] = [
  { id: "focus-session", label: "Focus Session", description: "Start and manage focus sessions" },
  { id: "scheduling", label: "Scheduling", description: "Plan your time blocks" },
  { id: "projects", label: "Projects", description: "Manage project boards" },
  { id: "categorization", label: "Categorization", description: "Organize activities" },
  { id: "classify", label: "Classify", description: "Activity classification rules" },
  { id: "analytics", label: "Analytics", description: "View charts and insights" },
  { id: "focus-music", label: "Focus Music", description: "Background music player" },
  { id: "reports", label: "Reports", description: "Generate time reports" },
  { id: "logs", label: "Logs", description: "Activity history" },
  { id: "settings", label: "Settings", description: "App configuration" },
];

export function CustomizationSection() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("appearance");

  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => {
      return trpcClient.user.getPreferences.query();
    },
  });

  const updatePreferences = async (updates: any) => {
    await trpcClient.user.updatePreferences.mutate(updates);
    queryClient.invalidateQueries({ queryKey: ["user.getPreferences"] });
  };

  const resetPreferences = async () => {
    if (confirm("Are you sure you want to reset all customization settings to defaults?")) {
      await trpcClient.user.resetPreferences.mutate();
      queryClient.invalidateQueries({ queryKey: ["user.getPreferences"] });
    }
  };

  if (!preferences) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customization</h2>
          <p className="text-sm text-muted-foreground">
            Personalize itracksy to match your style and workflow
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetPreferences}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="sidebar">
            <Layout className="mr-2 h-4 w-4" />
            Sidebar
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="focus">
            <Focus className="mr-2 h-4 w-4" />
            Focus Mode
          </TabsTrigger>
        </TabsList>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="space-y-4">
          {/* Theme Variant Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Style
              </CardTitle>
              <CardDescription>
                Choose a color theme that matches your personality and work style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(THEME_VARIANTS) as ThemeVariant[]).map((variant) => {
                  const theme = THEME_VARIANTS[variant];
                  const isActive = preferences.appearance.themeVariant === variant;

                  return (
                    <button
                      key={variant}
                      onClick={() =>
                        updatePreferences({
                          appearance: { themeVariant: variant },
                        })
                      }
                      className={cn(
                        "relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isActive && (
                        <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-primary" />
                      )}
                      <div className="mb-3 flex gap-2">
                        {Object.values(theme.colors)
                          .slice(0, 4)
                          .map((color, i) => (
                            <div
                              key={i}
                              className="h-8 w-8 rounded-md border border-border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                      </div>
                      <h4 className="mb-1 font-semibold">{theme.name}</h4>
                      <p className="mb-2 text-xs text-muted-foreground">{theme.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {theme.bestFor.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
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
                  <p className="text-sm text-muted-foreground">
                    Use rounded corners for UI elements
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Minimize animations for accessibility
                  </p>
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
        </TabsContent>

        {/* SIDEBAR TAB */}
        <TabsContent value="sidebar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visible Menu Items</CardTitle>
              <CardDescription>
                Choose which pages appear in your sidebar. Hide features you don't use to keep your
                workspace clean.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SIDEBAR_ITEMS.map((item) => {
                const isVisible = preferences.sidebar.visibleItems.includes(item.id);
                const isPinned = preferences.sidebar.pinnedItems.includes(item.id);
                const isSettings = item.id === "settings";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{item.label}</Label>
                        {isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                        {isSettings && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={isVisible}
                      disabled={isSettings}
                      onCheckedChange={(checked) => {
                        const newVisibleItems = checked
                          ? [...preferences.sidebar.visibleItems, item.id]
                          : preferences.sidebar.visibleItems.filter((id) => id !== item.id);

                        updatePreferences({
                          sidebar: { visibleItems: newVisibleItems },
                        });
                      }}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sidebar Behavior</CardTitle>
              <CardDescription>Control how the sidebar appears and behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Collapsed by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Start with sidebar in collapsed icon-only mode
                  </p>
                </div>
                <Switch
                  checked={preferences.sidebar.collapsed}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      sidebar: { collapsed: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sound Settings
              </CardTitle>
              <CardDescription>Control notification sounds and volume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sounds</Label>
                  <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                </div>
                <Switch
                  checked={preferences.notifications.soundEnabled}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { soundEnabled: checked },
                    })
                  }
                />
              </div>

              {preferences.notifications.soundEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-muted-foreground">
                      {preferences.notifications.soundVolume}%
                    </span>
                  </div>
                  <Slider
                    value={[preferences.notifications.soundVolume]}
                    onValueChange={([value]) =>
                      updatePreferences({
                        notifications: { soundVolume: value },
                      })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show system notifications outside the app
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.showDesktopNotifications}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { showDesktopNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show notifications within the app</p>
                </div>
                <Switch
                  checked={preferences.notifications.showInAppNotifications}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { showInAppNotifications: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Focus Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Remind you to start focus sessions
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.focusReminders}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { focusReminders: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Break Reminders</Label>
                  <p className="text-sm text-muted-foreground">Remind you to take breaks</p>
                </div>
                <Switch
                  checked={preferences.notifications.breakReminders}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { breakReminders: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Goal Achievements</Label>
                  <p className="text-sm text-muted-foreground">Celebrate when you reach goals</p>
                </div>
                <Switch
                  checked={preferences.notifications.goalAchievements}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: { goalAchievements: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOCUS MODE TAB */}
        <TabsContent value="focus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Durations</CardTitle>
              <CardDescription>Set your preferred focus and break session lengths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Focus Duration</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.focus.defaultFocusDuration} minutes
                  </span>
                </div>
                <Slider
                  value={[preferences.focus.defaultFocusDuration]}
                  onValueChange={([value]) =>
                    updatePreferences({
                      focus: { defaultFocusDuration: value },
                    })
                  }
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Break Duration</Label>
                  <span className="text-sm text-muted-foreground">
                    {preferences.focus.defaultBreakDuration} minutes
                  </span>
                </div>
                <Slider
                  value={[preferences.focus.defaultBreakDuration]}
                  onValueChange={([value]) =>
                    updatePreferences({
                      focus: { defaultBreakDuration: value },
                    })
                  }
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Behavior</CardTitle>
              <CardDescription>Automate your focus workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Start Breaks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start break timer after focus session
                  </p>
                </div>
                <Switch
                  checked={preferences.focus.autoStartBreaks}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      focus: { autoStartBreaks: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Start Next Session</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start next focus session after break
                  </p>
                </div>
                <Switch
                  checked={preferences.focus.autoStartNextSession}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      focus: { autoStartNextSession: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distraction Management</CardTitle>
              <CardDescription>Minimize distractions during focus sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dim Inactive Windows</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce opacity of non-focus windows
                  </p>
                </div>
                <Switch
                  checked={preferences.focus.dimInactiveWindows}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      focus: { dimInactiveWindows: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hide Distractions</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide non-essential UI elements during focus
                  </p>
                </div>
                <Switch
                  checked={preferences.focus.hideDistractions}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      focus: { hideDistractions: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

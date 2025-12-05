import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { UserPreferences, SidebarItem } from "@/lib/types/user-preferences";

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

interface SidebarTabProps {
  preferences: UserPreferences;
  updatePreferences: (updates: any) => Promise<void>;
}

export function SidebarTab({ preferences, updatePreferences }: SidebarTabProps) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}

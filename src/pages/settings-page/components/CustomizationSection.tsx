import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, Bell, Eye, Settings, RotateCcw } from "lucide-react";
import { Focus } from "lucide-react";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { SidebarTab } from "./tabs/SidebarTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { FocusTab } from "./tabs/FocusTab";
import { SystemTab } from "./tabs/SystemTab";

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
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">
            <Eye className="mr-2 h-4 w-4" />
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
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <AppearanceTab preferences={preferences} updatePreferences={updatePreferences} />
        </TabsContent>

        <TabsContent value="sidebar">
          <SidebarTab preferences={preferences} updatePreferences={updatePreferences} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab preferences={preferences} updatePreferences={updatePreferences} />
        </TabsContent>

        <TabsContent value="focus">
          <FocusTab preferences={preferences} updatePreferences={updatePreferences} />
        </TabsContent>

        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

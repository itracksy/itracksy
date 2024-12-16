import * as React from "react";
import { LayoutGrid, FolderClosed, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BottomSideBar } from "./BottomBar";

// This is sample data.
const items = [
  {
    title: "Dashboard",
    icon: LayoutGrid,
    url: "#",
    isActive: true,
  },
  {
    title: "Projects",
    icon: FolderClosed,
    url: "/projects",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeItem, setActiveItem] = React.useState<string | null>(null);

  return (
    <Sidebar collapsible="icon" className={cn("bg-white dark:bg-background", className)} {...props}>
      <SidebarHeader className="text-sm font-semibold"></SidebarHeader>
      <div className="flex items-center justify-end">
        <SidebarTrigger />
      </div>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={activeItem === item.title}
                tooltip={item.title}
                className="gap-2"
              >
                <Link
                  to={item.url}
                  onClick={() => {
                    setActiveItem(item.title);
                  }}
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <BottomSideBar />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

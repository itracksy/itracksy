import * as React from "react";
import {
  BarChart,
  FolderClosed,
  Settings,
  Timer,
  BookOpen,
  Target,
  ChevronRight,
  Tags,
  FileText,
  Music,
  CalendarClock,
  ScrollText,
} from "lucide-react";
import logoImage from "../../logo.png";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { SidebarItem } from "@/lib/types/user-preferences";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BottomSideBar } from "./BottomSideBar";

// Sidebar item ID mapping
const SIDEBAR_ITEM_MAP: Record<SidebarItem, string> = {
  "focus-session": "Focus Session",
  scheduling: "Scheduling",
  projects: "Projects",
  categorization: "Categorization",
  classify: "Classify",
  analytics: "Analytics",
  "focus-music": "Focus Music",
  reports: "Reports",
  logs: "Logs",
  settings: "Settings",
};

// Section definitions with themed colors
const SECTIONS = [
  {
    id: "focus",
    label: "Focus",
    color: "amber",
    items: ["focus-session", "scheduling"],
  },
  {
    id: "productivity",
    label: "Productivity",
    color: "blue",
    items: ["projects", "analytics", "reports"],
  },
  {
    id: "classification",
    label: "Classification",
    color: "purple",
    items: ["categorization", "classify"],
  },
  {
    id: "tools",
    label: "Tools",
    color: "slate",
    items: ["focus-music", "logs"],
  },
];

// Icon color classes by section
const ICON_COLORS: Record<string, string> = {
  amber: "text-amber-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  slate: "text-slate-400 dark:text-slate-500",
};

// Active background colors by section
const ACTIVE_BG: Record<string, string> = {
  amber: "bg-amber-500/10 dark:bg-amber-500/10",
  blue: "bg-blue-500/10 dark:bg-blue-500/10",
  purple: "bg-purple-500/10 dark:bg-purple-500/10",
  slate: "bg-slate-500/10 dark:bg-slate-500/10",
};

// Active border colors by section
const ACTIVE_BORDER: Record<string, string> = {
  amber: "border-l-amber-500",
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  slate: "border-l-slate-400",
};

// All available sidebar items
const ALL_ITEMS = [
  {
    id: "focus-session" as SidebarItem,
    title: "Focus",
    icon: Timer,
    url: "/",
    section: "amber",
  },
  {
    id: "scheduling" as SidebarItem,
    title: "Schedule",
    icon: CalendarClock,
    url: "/scheduling",
    section: "amber",
  },
  {
    id: "projects" as SidebarItem,
    title: "Projects",
    icon: FolderClosed,
    url: "/projects",
    section: "blue",
  },
  {
    id: "analytics" as SidebarItem,
    title: "Analytics",
    icon: BarChart,
    url: "/dashboard",
    section: "blue",
  },
  {
    id: "reports" as SidebarItem,
    title: "Reports",
    icon: FileText,
    url: "/reports",
    section: "blue",
  },
  {
    id: "categorization" as SidebarItem,
    title: "Categories",
    icon: Tags,
    url: "/categorization",
    section: "purple",
  },
  {
    id: "classify" as SidebarItem,
    title: "Classify",
    icon: Target,
    url: "/classify",
    section: "purple",
    subItems: [
      {
        title: "Rule Book",
        icon: BookOpen,
        url: "/rule-book",
      },
    ],
  },
  {
    id: "focus-music" as SidebarItem,
    title: "Music",
    icon: Music,
    url: "/music",
    section: "slate",
  },
  {
    id: "logs" as SidebarItem,
    title: "Logs",
    icon: ScrollText,
    url: "/logs",
    section: "slate",
  },
  {
    id: "settings" as SidebarItem,
    title: "Settings",
    icon: Settings,
    url: "/settings",
    section: "slate",
  },
];

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const [openSubMenus, setOpenSubMenus] = React.useState<Set<string>>(new Set());

  // Get current route to highlight active item
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Load user preferences
  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => {
      return trpcClient.user.getPreferences.query();
    },
  });

  const toggleSubMenu = (itemTitle: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemTitle)) {
        newSet.delete(itemTitle);
      } else {
        newSet.add(itemTitle);
      }
      return newSet;
    });
  };

  // Filter items based on user preferences
  const visibleItems = React.useMemo(() => {
    if (!preferences) return ALL_ITEMS;
    return ALL_ITEMS.filter((item) => preferences.sidebar.visibleItems.includes(item.id));
  }, [preferences]);

  // Check if item is active
  const isItemActive = (url: string) => {
    if (url === "/") return currentPath === "/";
    return currentPath.startsWith(url);
  };

  // Group items by section
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, typeof visibleItems> = {};
    SECTIONS.forEach((section) => {
      groups[section.id] = visibleItems.filter(
        (item) => section.items.includes(item.id) && item.id !== "settings"
      );
    });
    return groups;
  }, [visibleItems]);

  // Settings item separate
  const settingsItem = visibleItems.find((item) => item.id === "settings");

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950",
        className
      )}
      {...props}
    >
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="iTracksy" className="h-8 w-8" />
          <span className="text-lg font-semibold text-slate-900 dark:text-white">iTracksy</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {SECTIONS.map((section) => {
          const sectionItems = groupedItems[section.id];
          if (!sectionItems || sectionItems.length === 0) return null;

          return (
            <div key={section.id} className="mb-4">
              {/* Section Header */}
              <div className="mb-2 px-3">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    ICON_COLORS[section.color]
                  )}
                >
                  {section.label}
                </span>
              </div>

              <SidebarMenu>
                {sectionItems.map((item) => {
                  const isActive = isItemActive(item.url);

                  return (
                    <SidebarMenuItem key={item.id}>
                      {item.subItems ? (
                        <>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={cn(
                              "group relative gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 transition-all duration-200",
                              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                              "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                              isActive && [
                                ACTIVE_BG[item.section],
                                ACTIVE_BORDER[item.section],
                                "text-slate-900 dark:text-white",
                              ]
                            )}
                          >
                            <Link to={item.url} onClick={() => toggleSubMenu(item.title)}>
                              <item.icon
                                className={cn(
                                  "h-[18px] w-[18px] transition-colors",
                                  isActive
                                    ? ICON_COLORS[item.section]
                                    : "text-slate-400 dark:text-slate-500",
                                  !isActive && `group-hover:${ICON_COLORS[item.section]}`
                                )}
                              />
                              <span className="font-medium">{item.title}</span>
                              <ChevronRight
                                className={cn(
                                  "ml-auto h-4 w-4 text-slate-400 transition-transform duration-200",
                                  openSubMenus.has(item.title) && "rotate-90"
                                )}
                              />
                            </Link>
                          </SidebarMenuButton>
                          {openSubMenus.has(item.title) && (
                            <SidebarMenuSub className="ml-6 mt-1 border-l border-slate-200 dark:border-slate-700">
                              {item.subItems.map((subItem) => {
                                const isSubActive = isItemActive(subItem.url);
                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className={cn(
                                        "rounded-md py-2 pl-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                                        "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                                        isSubActive &&
                                          "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                                      )}
                                    >
                                      <Link to={subItem.url}>
                                        <subItem.icon className="h-4 w-4" />
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          )}
                        </>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "group relative gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 transition-all duration-200",
                            "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                            isActive && [
                              ACTIVE_BG[item.section],
                              ACTIVE_BORDER[item.section],
                              "text-slate-900 dark:text-white",
                            ]
                          )}
                        >
                          <Link to={item.url}>
                            <item.icon
                              className={cn(
                                "h-[18px] w-[18px] transition-colors",
                                isActive
                                  ? ICON_COLORS[item.section]
                                  : "text-slate-400 dark:text-slate-500"
                              )}
                            />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          );
        })}

        {/* Settings at the bottom of the menu area */}
        {settingsItem && (
          <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(settingsItem.url)}
                  tooltip={settingsItem.title}
                  className={cn(
                    "group gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    isItemActive(settingsItem.url) &&
                      "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  )}
                >
                  <Link to={settingsItem.url}>
                    <settingsItem.icon className="h-[18px] w-[18px] text-slate-400 dark:text-slate-500" />
                    <span className="font-medium">{settingsItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-3 dark:border-slate-800">
        <BottomSideBar />
      </SidebarFooter>

      <SidebarRail className="border-slate-200 dark:border-slate-800" />
    </Sidebar>
  );
}

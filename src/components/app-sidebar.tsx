import * as React from "react";
import {
  BarChart,
  FolderClosed,
  Settings,
  Timer,
  Trophy,
  BookOpen,
  Target,
  ChevronRight,
  Tags,
  FileText,
  Music,
  CalendarClock,
} from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BottomSideBar } from "./BottomSideBar";

// This is sample data.
const items = [
  {
    title: "Focus Session",
    icon: Timer,
    url: "/",
    isActive: true,
  },
  {
    title: "Scheduling",
    icon: CalendarClock,
    url: "/scheduling",
  },

  {
    title: "Projects",
    icon: FolderClosed,
    url: "/projects",
  },
  {
    title: "Categorization",
    icon: Tags,
    url: "/categorization",
  },
  {
    title: "Classify",
    icon: Target,
    url: "/classify",
    subItems: [
      {
        title: "Rule Book",
        icon: BookOpen,
        url: "/rule-book",
      },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart,
    url: "/dashboard",
  },
  {
    title: "Focus Music",
    icon: Music,
    url: "/music",
  },
  {
    title: "Reports",
    icon: FileText,
    url: "/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeItem, setActiveItem] = React.useState<string | null>(null);
  const [openSubMenus, setOpenSubMenus] = React.useState<Set<string>>(new Set());

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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-tracksy-gold/20 bg-white/80 backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80",
        className
      )}
      {...props}
    >
      <SidebarHeader className="text-sm font-semibold text-tracksy-blue dark:text-white"></SidebarHeader>

      <SidebarContent className="pt-7">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <>
                  <SidebarMenuButton
                    asChild
                    isActive={activeItem === item.title}
                    tooltip={item.title}
                    className={cn(
                      "gap-2 text-tracksy-blue/70 transition-colors dark:text-white/70",
                      "hover:bg-tracksy-gold/10 hover:text-tracksy-blue",
                      "dark:hover:bg-tracksy-gold/5 dark:hover:text-tracksy-gold",
                      activeItem === item.title &&
                        "bg-tracksy-gold/10 text-tracksy-blue dark:bg-tracksy-gold/5 dark:text-white"
                    )}
                  >
                    <Link
                      to={item.url}
                      onClick={() => {
                        setActiveItem(item.title);
                        toggleSubMenu(item.title);
                      }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto size-4 transition-transform",
                          openSubMenus.has(item.title) && "rotate-90"
                        )}
                      />
                    </Link>
                  </SidebarMenuButton>
                  {openSubMenus.has(item.title) && (
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={activeItem === subItem.title}>
                            <Link to={subItem.url} onClick={() => setActiveItem(subItem.title)}>
                              <subItem.icon className="size-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={activeItem === item.title}
                  tooltip={item.title}
                  className={cn(
                    "gap-2 text-tracksy-blue/70 transition-colors dark:text-white/70",
                    "hover:bg-tracksy-gold/10 hover:text-tracksy-blue",
                    "dark:hover:bg-tracksy-gold/5 dark:hover:text-tracksy-gold",
                    activeItem === item.title &&
                      "bg-tracksy-gold/10 text-tracksy-blue dark:bg-tracksy-gold/5 dark:text-white"
                  )}
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
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <BottomSideBar />
      </SidebarFooter>
      <SidebarRail className="border-tracksy-gold/20 dark:border-tracksy-gold/10" />
    </Sidebar>
  );
}

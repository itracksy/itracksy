import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { useRouterState } from "@tanstack/react-router";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DragWindowRegion from "@/components/DragWindowRegion";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="flex h-screen flex-col">
      {/* Drag region for macOS hidden title bar */}
      <DragWindowRegion />

      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <AppSidebar />

          <main
            data-route={currentPath}
            className="flex-1 overflow-auto bg-gradient-to-br from-tracksy-blue/5 to-tracksy-gold/5 dark:from-tracksy-blue/10 dark:to-tracksy-gold/10"
          >
            <SidebarTrigger className="absolute top-4 z-10" />
            {children}
          </main>
          <Toaster />
        </SidebarProvider>
      </div>
    </div>
  );
}

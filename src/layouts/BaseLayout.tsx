import React from "react";
import { Toaster } from "@/components/ui/toaster";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DragWindowRegion from "@/components/DragWindowRegion";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      {/* Drag region for frameless window */}
      <DragWindowRegion title="iTracksy" />

      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <AppSidebar />

          <main className="flex-1 overflow-auto">
            <SidebarTrigger className="absolute top-4 z-10" />
            {children}
          </main>
          <Toaster />
        </SidebarProvider>
      </div>
    </div>
  );
}

import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <AppSidebar />

          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarProvider>
      </div>
    </div>
  );
}

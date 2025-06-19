import React from "react";
import { Toaster } from "@/components/ui/toaster";
import DragWindowRegion from "@/components/DragWindowRegion";

export default function FullScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen">
      <DragWindowRegion title="iTracksy" />
      {children}
      <Toaster />
    </div>
  );
}

import React from "react";
import { Toaster } from "@/components/ui/toaster";

export default function FullScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen">
      {children}
      <Toaster />
    </div>
  );
}

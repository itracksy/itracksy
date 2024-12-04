import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import Sidebar from "@/components/Sidebar";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col">
            <DragWindowRegion title="electron-shadcn" />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}

import React from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="p-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Navigation</h2>
        <div className="space-y-1">
          <Link to="/">
            {({ isActive }) => (
              <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            )}
          </Link>
          <Link to="/projects">
            {({ isActive }) => (
              <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start">
                <FolderKanban className="mr-2 h-4 w-4" />
                Projects
              </Button>
            )}
          </Link>
          <Link to="/settings">
            {({ isActive }) => (
              <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

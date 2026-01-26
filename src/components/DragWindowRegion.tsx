import React from "react";

// Only show drag region on macOS where we use hidden title bar
const isMacOS = navigator.platform.toLowerCase().includes("mac");

export default function DragWindowRegion() {
  // On Windows/Linux, the native title bar handles everything
  if (!isMacOS) {
    return null;
  }

  // On macOS, provide a drag region for the hidden title bar
  return <div className="draglayer h-8 w-full shrink-0" />;
}

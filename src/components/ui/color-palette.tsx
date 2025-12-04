/**
 * Color Palette Component
 *
 * This component displays all brand colors for design reference.
 * Use this in Storybook or a dev-only page to visualize the color system.
 */

import React from "react";

interface ColorSwatchProps {
  name: string;
  hex: string;
  className?: string;
  textColor?: "light" | "dark";
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  name,
  hex,
  className = "",
  textColor = "light",
}) => {
  return (
    <div className="flex flex-col">
      <div
        className={`flex h-24 items-center justify-center rounded-lg font-mono text-sm ${className}`}
        style={{ backgroundColor: hex }}
      >
        <span className={textColor === "light" ? "text-white" : "text-gray-900"}>{hex}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{name}</p>
    </div>
  );
};

export const ColorPalette: React.FC = () => {
  return (
    <div className="bg-background p-8">
      <h1 className="mb-8 text-4xl font-bold text-foreground">itracksy Color Palette</h1>

      {/* Primary Brand Colors */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Primary Brand Colors</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
          <ColorSwatch name="Primary Purple" hex="#8B5CF6" />
          <ColorSwatch name="Secondary Pink" hex="#EC4899" />
          <ColorSwatch name="Cyan" hex="#06B6D4" />
          <ColorSwatch name="Blue" hex="#3B82F6" />
          <ColorSwatch name="Success Green" hex="#10B981" />
        </div>
      </section>

      {/* Semantic Colors */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Semantic Colors</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          <ColorSwatch name="Error Red" hex="#EF4444" />
          <ColorSwatch name="Warning Amber" hex="#F59E0B" />
          <ColorSwatch name="Info Blue" hex="#3B82F6" />
          <ColorSwatch name="Success Green" hex="#10B981" />
        </div>
      </section>

      {/* Grayscale */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Grayscale</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 lg:grid-cols-10">
          <ColorSwatch name="Gray 50" hex="#F9FAFB" textColor="dark" />
          <ColorSwatch name="Gray 100" hex="#F3F4F6" textColor="dark" />
          <ColorSwatch name="Gray 200" hex="#E5E7EB" textColor="dark" />
          <ColorSwatch name="Gray 300" hex="#D1D5DB" textColor="dark" />
          <ColorSwatch name="Gray 400" hex="#9CA3AF" />
          <ColorSwatch name="Gray 500" hex="#6B7280" />
          <ColorSwatch name="Gray 600" hex="#4B5563" />
          <ColorSwatch name="Gray 700" hex="#374151" />
          <ColorSwatch name="Gray 800" hex="#1F2937" />
          <ColorSwatch name="Gray 900" hex="#111827" />
        </div>
      </section>

      {/* Gradients */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Gradients</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="font-semibold text-white">Primary Gradient</span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">Purple to Pink</p>
            <code className="mt-1 text-xs text-muted-foreground">bg-gradient-primary</code>
          </div>

          <div className="flex flex-col">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-secondary">
              <span className="font-semibold text-white">Secondary Gradient</span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">Cyan to Blue</p>
            <code className="mt-1 text-xs text-muted-foreground">bg-gradient-secondary</code>
          </div>

          <div className="flex flex-col">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-success">
              <span className="font-semibold text-white">Success Gradient</span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">Green to Cyan</p>
            <code className="mt-1 text-xs text-muted-foreground">bg-gradient-success</code>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Usage Examples</h2>

        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <h3 className="mb-3 text-lg font-medium text-foreground">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg bg-gradient-primary px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90">
                Primary Button
              </button>
              <button className="rounded-lg border-2 border-primary bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary-50">
                Secondary Button
              </button>
              <button className="rounded-lg bg-success px-6 py-3 font-semibold text-white transition-colors hover:bg-success/90">
                Success Button
              </button>
              <button className="rounded-lg border-2 border-border bg-transparent px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted">
                Ghost Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="mb-3 text-lg font-medium text-foreground">Cards</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6 shadow-md">
                <h4 className="mb-2 text-lg font-semibold text-card-foreground">Standard Card</h4>
                <p className="text-sm text-muted-foreground">Clean and simple card design</p>
              </div>

              <div className="rounded-lg bg-gradient-primary p-6 text-white shadow-md">
                <h4 className="mb-2 text-lg font-semibold">Featured Card</h4>
                <p className="text-sm opacity-90">With gradient background</p>
              </div>

              <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-md">
                <h4 className="mb-2 text-lg font-semibold text-primary">Highlighted Card</h4>
                <p className="text-sm text-muted-foreground">With colored border</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="mb-3 text-lg font-medium text-foreground">Alerts</h3>
            <div className="space-y-3">
              <div className="rounded-md border-l-4 border-success bg-success/10 p-4">
                <p className="font-semibold text-success">Success</p>
                <p className="text-sm text-success/80">
                  Your changes have been saved successfully.
                </p>
              </div>

              <div className="rounded-md border-l-4 border-destructive bg-destructive/10 p-4">
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/80">
                  Something went wrong. Please try again.
                </p>
              </div>

              <div className="rounded-md border-l-4 border-warning bg-warning/10 p-4">
                <p className="font-semibold text-warning">Warning</p>
                <p className="text-sm text-warning/80">This action cannot be undone.</p>
              </div>

              <div className="rounded-md border-l-4 border-info bg-info/10 p-4">
                <p className="font-semibold text-info">Info</p>
                <p className="text-sm text-info/80">You have 3 new notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ColorPalette;

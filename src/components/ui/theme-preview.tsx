import { THEME_VARIANTS, type ThemeVariant } from "@/lib/types/user-preferences";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  variant: ThemeVariant;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Visual preview component for theme variants
 * Shows a miniature representation of the theme colors
 */
export function ThemePreview({ variant, isActive, onClick, className }: ThemePreviewProps) {
  const theme = THEME_VARIANTS[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all",
        "hover:scale-105 hover:shadow-lg",
        isActive
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50",
        className
      )}
    >
      {/* Color swatches */}
      <div className="mb-3 flex gap-2">
        <div
          className="h-10 w-10 rounded-md border border-border shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary color"
        />
        <div
          className="h-10 w-10 rounded-md border border-border shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: theme.colors.secondary }}
          title="Secondary color"
        />
        <div
          className="h-10 w-10 rounded-md border border-border shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent color"
        />
      </div>

      {/* Theme info */}
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground">{theme.name}</h4>
        <p className="line-clamp-2 text-xs text-muted-foreground">{theme.description}</p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/**
 * Grid of all theme previews
 */
export function ThemePreviewGrid({
  activeVariant,
  onSelect,
}: {
  activeVariant: ThemeVariant;
  onSelect: (variant: ThemeVariant) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(THEME_VARIANTS) as ThemeVariant[]).map((variant) => (
        <ThemePreview
          key={variant}
          variant={variant}
          isActive={activeVariant === variant}
          onClick={() => onSelect(variant)}
        />
      ))}
    </div>
  );
}

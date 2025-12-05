import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PreferenceCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable card component for preference sections
 * Provides consistent styling across customization UI
 */
export function PreferenceCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PreferenceCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

interface PreferenceRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Row layout for preference items
 * Label on left, control on right
 */
export function PreferenceRow({ label, description, children, className }: PreferenceRowProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex-1 space-y-0.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}

interface PreferenceGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Group related preferences together
 */
export function PreferenceGroup({ title, children, className }: PreferenceGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && <h4 className="text-sm font-semibold text-foreground">{title}</h4>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

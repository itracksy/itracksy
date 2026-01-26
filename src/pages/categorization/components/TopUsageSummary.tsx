/**
 * TopUsageSummary - Shows top apps and domains at a glance
 * Provides quick visibility into where time is being spent
 */

import React from "react";
import { Monitor, Globe } from "lucide-react";

interface TopUsageSummaryProps {
  topApps: readonly {
    readonly ownerName: string;
    readonly totalDuration: number;
    readonly percentage: number;
  }[];
  topDomains: readonly {
    readonly domain: string;
    readonly totalDuration: number;
  }[];
  formatDuration: (seconds: number) => string;
  isLoading?: boolean;
}

export const TopUsageSummary: React.FC<TopUsageSummaryProps> = ({
  topApps,
  topDomains,
  formatDuration,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Top Apps</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Top Domains</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topApps.length === 0 && topDomains.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Top Apps */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Top Apps</span>
        </div>
        <div className="space-y-2">
          {topApps.slice(0, 5).map((app, index) => (
            <div key={app.ownerName} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 truncate">
                <span className="w-4 text-muted-foreground">{index + 1}.</span>
                <span className="truncate">{app.ownerName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{formatDuration(app.totalDuration)}</span>
                <span className="w-10 text-right text-xs">{app.percentage}%</span>
              </div>
            </div>
          ))}
          {topApps.length === 0 && <p className="text-sm text-muted-foreground">No app data yet</p>}
        </div>
      </div>

      {/* Top Domains */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Top Domains</span>
        </div>
        <div className="space-y-2">
          {topDomains.slice(0, 5).map((domain, index) => (
            <div key={domain.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 truncate">
                <span className="w-4 text-muted-foreground">{index + 1}.</span>
                <span className="truncate">{domain.domain}</span>
              </div>
              <span className="text-muted-foreground">{formatDuration(domain.totalDuration)}</span>
            </div>
          ))}
          {topDomains.length === 0 && (
            <p className="text-sm text-muted-foreground">No domain data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

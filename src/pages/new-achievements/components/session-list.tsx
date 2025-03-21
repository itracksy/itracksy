"use client";

import TimeRangeSelector from "@/components/TimeRangeSelector";
import { SessionCard } from "./session-card";

import { useState } from "react";
import { TimeRange } from "@/types/time";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

interface SessionListProps {
  expandedSessionId: string | null;
  setExpandedSessionId: (id: string | null) => void;
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: number,
    isProductive: boolean
  ) => void;
}

export function SessionList({
  expandedSessionId,
  setExpandedSessionId,
  onClassify,
}: SessionListProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    start: new Date(),
    end: new Date(),
    label: "Today",
  });
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["timeEntry.getTimeEntriesByTimeRange"],
    queryFn: () =>
      trpcClient.timeEntry.getTimeEntriesByTimeRange.query({
        startTimestamp: selectedTimeRange.start.getTime(),
        endTimestamp: selectedTimeRange.end.getTime(),
      }),
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!sessions) {
    return <div>Failed to load sessions</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Focus Sessions
          <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
        </h2>
        <TimeRangeSelector onRangeChange={setSelectedTimeRange} />
      </div>
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center">
          <p className="text-gray-500">No focus sessions recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSessionId === session.id}
              onToggle={() =>
                setExpandedSessionId(expandedSessionId === session.id ? null : session.id)
              }
              onClassify={onClassify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

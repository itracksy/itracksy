"use client";

import TimeRangeSelector from "@/components/TimeRangeSelector";
import { SessionCard } from "./session-card";

import { TimeRange } from "@/types/time";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useState } from "react";

interface SessionListProps {
  startTimestamp: number;
  endTimestamp: number;
  onRangeChange: (range: TimeRange) => void;
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: number,
    isProductive: boolean
  ) => void;
}

export function SessionList({
  onClassify,
  onRangeChange,
  startTimestamp,
  endTimestamp,
}: SessionListProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  // Use useQuery with proper error handling
  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timeEntry.getTimeEntriesByTimeRange", startTimestamp, endTimestamp],
    queryFn: async () => {
      try {
        return await trpcClient.timeEntry.getTimeEntriesByTimeRange.query({
          startTimestamp,
          endTimestamp,
        });
      } catch (error) {
        console.error("Error fetching time entries:", error);
        return [];
      }
    },
    // Add these options to prevent excessive retries and refetching
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div>Error loading sessions: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Focus Sessions
          <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
        </h2>
        <TimeRangeSelector onRangeChange={onRangeChange} />
      </div>
      {!sessions || sessions.length === 0 ? (
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
              onToggle={() => {
                setExpandedSessionId(expandedSessionId === session.id ? null : session.id);
              }}
              onClassify={onClassify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import TimeRangeSelector from "@/components/TimeRangeSelector";
import { SessionCard } from "./session-card";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useState } from "react";
import { useAtom } from "jotai";

import { selectedClassificationTimeRangeAtom } from "@/context/timeRange";

interface SessionListProps {}

export function SessionList({}: SessionListProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedClassificationTimeRangeAtom);

  const startTimestamp = selectedTimeRange.start;
  const endTimestamp = selectedTimeRange.end;

  // Use useQuery with proper error handling
  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timeEntry.getTimeEntriesByTimeRange", startTimestamp, endTimestamp, true],
    queryFn: async () => {
      return await trpcClient.timeEntry.getTimeEntriesByTimeRange.query({
        startTimestamp,
        endTimestamp,
        isFocusMode: true, // Only fetch focus sessions, not break sessions
      });
    },
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Focus Session History
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and classify activities from your sessions
          </p>
          <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
        </div>
        <TimeRangeSelector
          start={selectedTimeRange.start}
          end={selectedTimeRange.end}
          value={selectedTimeRange.value}
          onRangeChange={setSelectedTimeRange}
        />
      </div>
      {!sessions || sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No focus sessions recorded yet.</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

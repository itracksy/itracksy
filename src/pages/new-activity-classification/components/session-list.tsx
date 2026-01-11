"use client";

import TimeRangeSelector from "@/components/TimeRangeSelector";
import { SessionCard } from "./session-card";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useState } from "react";
import { useAtom } from "jotai";
import { History, Calendar } from "lucide-react";

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
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
        <p className="text-red-600 dark:text-red-400">Error loading sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
            <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Session History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sessions?.length || 0} focus {sessions?.length === 1 ? "session" : "sessions"}
            </p>
          </div>
        </div>
        <TimeRangeSelector
          start={selectedTimeRange.start}
          end={selectedTimeRange.end}
          value={selectedTimeRange.value}
          onRangeChange={setSelectedTimeRange}
        />
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-gray-500 dark:text-gray-400">No focus sessions in this period</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Start a focus session to track your productivity
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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

"use client";

import { SessionCard } from "./session-card";
import type { Session, Rule } from "@/lib/types";

interface SessionListProps {
  sessions: Session[];
  rules: Rule[];
  expandedSessionId: string | null;
  setExpandedSessionId: (id: string | null) => void;
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => void;
}

export function SessionList({
  sessions,
  rules,
  expandedSessionId,
  setExpandedSessionId,
  onClassify,
}: SessionListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Your Focus Sessions</h2>

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
              rules={rules}
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

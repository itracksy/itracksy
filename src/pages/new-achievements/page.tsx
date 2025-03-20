import { useState } from "react";
import { SummaryCard } from "./components/summary-card";
import { SessionList } from "./components/session-list";
import { RulesPanel } from "./components/rules-panel";
import { RuleCreationToast } from "./components/rule-creation-toast";
import { mockSessions, mockRules } from "@/lib/mock-data";
import type { Rule } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function FocusSessionsAchievement() {
  const [sessions, setSessions] = useState(mockSessions);
  const [rules, setRules] = useState(mockRules);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate summary statistics
  const totalFocusTime = sessions.reduce((total, session) => total + session.duration, 0);
  const totalSessions = sessions.length;

  const classifiedActivities = sessions.flatMap((session) =>
    session.activities.filter((activity) => activity.isClassified)
  );

  const totalActivities = sessions.flatMap((session) => session.activities).length;
  const classificationProgress =
    totalActivities > 0 ? Math.round((classifiedActivities.length / totalActivities) * 100) : 0;

  const productiveTime = sessions
    .flatMap((session) => session.activities.filter((activity) => activity.isProductive))
    .reduce((total, activity) => total + activity.duration, 0);

  const productivityPercentage =
    totalFocusTime > 0 ? Math.round((productiveTime / totalFocusTime) * 100) : 0;

  // Check if a rule exists
  const ruleExists = (type: "app" | "domain", name: string): Rule | undefined => {
    return rules.find((rule) => rule.type === type && rule.name === name);
  };

  // Create a new rule
  const createRule = (type: "app" | "domain", name: string, isProductive: boolean) => {
    // Check if rule already exists
    const existingRule = ruleExists(type, name);
    if (existingRule) {
      // Update existing rule if classification changed
      if (existingRule.isProductive !== isProductive) {
        const updatedRules = rules.map((rule) =>
          rule.id === existingRule.id ? { ...rule, isProductive } : rule
        );
        setRules(updatedRules);

        // Show toast for updated rule
        toast({
          title: "Rule Updated",
          description: `${type === "app" ? "App" : "Domain"} "${name}" will now be marked as ${isProductive ? "productive" : "distracting"}.`,
        });
      }
      return;
    }

    // Create new rule
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      type,
      name,
      isProductive,
      createdAt: new Date().toISOString(),
    };

    setRules((prev) => [...prev, newRule]);

    // Show toast with custom render
    toast({
      duration: 5000,
      // render: () => <RuleCreationToast rule={newRule} />,
    });
  };

  // Delete a rule
  const deleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));

    toast({
      title: "Rule Deleted",
      description: "The classification rule has been removed.",
    });
  };

  // Handle classification updates
  const handleClassification = (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id !== sessionId) return session;

        // If classifying at app level
        if (appName && !activityId && !domainName) {
          // Create a rule for the app
          createRule("app", appName, isProductive);

          // Apply to all activities of this app
          return {
            ...session,
            activities: session.activities.map((activity) => {
              if (activity.appName === appName) {
                return {
                  ...activity,
                  isClassified: true,
                  isProductive,
                };
              }
              return activity;
            }),
          };
        }

        // If classifying at domain level
        if (appName && domainName && !activityId) {
          // Create a rule for the domain
          createRule("domain", domainName, isProductive);

          // Apply to all activities of this domain
          return {
            ...session,
            activities: session.activities.map((activity) => {
              if (activity.appName === appName && activity.domainName === domainName) {
                return {
                  ...activity,
                  isClassified: true,
                  isProductive,
                };
              }
              return activity;
            }),
          };
        }

        // If classifying a specific activity
        return {
          ...session,
          activities: session.activities.map((activity) => {
            // Match by specific criteria
            const matchesApp = activity.appName === appName;
            const matchesDomain = domainName ? activity.domainName === domainName : true;
            const matchesActivity = activityId ? activity.id === activityId : true;

            if (matchesApp && matchesDomain && matchesActivity) {
              return {
                ...activity,
                isClassified: true,
                isProductive,
              };
            }
            return activity;
          }),
        };
      })
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Focus Sessions Achievement</h1>
        <RulesPanel rules={rules} onDeleteRule={deleteRule} />
      </div>

      <SummaryCard
        totalFocusTime={totalFocusTime}
        totalSessions={totalSessions}
        productivityPercentage={productivityPercentage}
        classificationProgress={classificationProgress}
      />

      <SessionList
        sessions={sessions}
        rules={rules}
        expandedSessionId={expandedSessionId}
        setExpandedSessionId={setExpandedSessionId}
        onClassify={handleClassification}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ActivityGroup } from "./activity-group";
import type { Session, Rule } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  rules: Rule[];
  isExpanded: boolean;
  onToggle: () => void;
  onClassify: (
    sessionId: string,
    appName: string,
    domainName: string | null,
    activityId: string,
    isProductive: boolean
  ) => void;
}

export function SessionCard({
  session,
  rules,
  isExpanded,
  onToggle,
  onClassify,
}: SessionCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevClassifiedCount, setPrevClassifiedCount] = useState(0);

  // Group activities by app
  const appGroups = session.activities.reduce(
    (groups, activity) => {
      const appName = activity.appName;
      if (!groups[appName]) {
        groups[appName] = [];
      }
      groups[appName].push(activity);
      return groups;
    },
    {} as Record<string, typeof session.activities>
  );

  // Calculate classification status
  const totalActivities = session.activities.length;
  const classifiedActivities = session.activities.filter((a) => a.isClassified).length;

  let classificationStatus: "unclassified" | "partial" | "complete" = "unclassified";
  if (classifiedActivities === totalActivities) {
    classificationStatus = "complete";
  } else if (classifiedActivities > 0) {
    classificationStatus = "partial";
  }

  // Calculate productivity for this session
  const productiveTime = session.activities
    .filter((activity) => activity.isProductive)
    .reduce((total, activity) => total + activity.duration, 0);

  const productivityPercentage =
    session.duration > 0 ? Math.round((productiveTime / session.duration) * 100) : 0;

  // Check if classification was just completed
  useEffect(() => {
    const currentClassifiedCount = session.activities.filter((a) => a.isClassified).length;

    if (currentClassifiedCount > prevClassifiedCount) {
      // Show celebration if all activities are now classified
      if (currentClassifiedCount === totalActivities) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }

    setPrevClassifiedCount(currentClassifiedCount);
  }, [session.activities, totalActivities, prevClassifiedCount]);

  return (
    <Card
      className={cn(
        "border transition-all duration-300",
        isExpanded ? "shadow-md" : "shadow-sm",
        showCelebration ? "border-[#E5A853]" : "border-gray-200"
      )}
    >
      <CardHeader
        className={cn(
          "flex cursor-pointer flex-row items-center justify-between p-4",
          isExpanded ? "border-b" : ""
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="font-medium text-gray-900">
              {format(new Date(session.date), "MMMM d, yyyy")}
            </h3>
            <p className="text-sm text-gray-500">{formatTime(session.duration)}</p>
          </div>

          <div className="flex items-center gap-1.5">
            {classificationStatus === "complete" && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Fully Classified
              </span>
            )}
            {classificationStatus === "partial" && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Partially Classified
              </span>
            )}
            {classificationStatus === "unclassified" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Unclassified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {classificationStatus !== "unclassified" && (
            <div className="text-sm font-medium text-gray-700">
              {productivityPercentage}% Productive
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(appGroups).map(([appName, activities]) => (
              <ActivityGroup
                key={`${session.id}-${appName}`}
                sessionId={session.id}
                appName={appName}
                activities={activities}
                rules={rules}
                onClassify={onClassify}
              />
            ))}
          </div>

          {showCelebration && (
            <div className="border-t border-[#E5A853]/30 bg-[#E5A853]/10 p-4 text-center">
              <p className="font-medium text-[#2B4474]">
                🎉 All activities classified! Your session is now {productivityPercentage}%
                productive.
              </p>
            </div>
          )}

          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Session Summary</p>
                <p className="text-xs text-gray-500">
                  {classifiedActivities} of {totalActivities} activities classified
                </p>
              </div>

              {classificationStatus !== "unclassified" && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-[#E5A853]"
                      style={{ width: `${productivityPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {productivityPercentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

import { Clock, CheckCircle, BarChart, Tag, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/lib/utils";
import { RulesInfo } from "./rules-info";

interface SummaryCardProps {
  totalFocusTime: number;
  totalSessions: number;
  productivityPercentage: number;
  classificationProgress: number;
}

export function SummaryCard({
  totalFocusTime,
  totalSessions,
  productivityPercentage,
  classificationProgress,
}: SummaryCardProps) {
  // Determine motivational message based on classification progress
  const getMotivationalMessage = () => {
    if (classificationProgress === 100)
      return "All activities classified! Great job keeping track of your productivity.";
    if (classificationProgress > 75)
      return "Almost there! Classify the remaining activities to get a complete picture.";
    if (classificationProgress > 50)
      return "Good progress! Continue classifying to improve your productivity insights.";
    if (classificationProgress > 25)
      return "You've started classifying! Keep going to unlock more insights.";
    return "Classify your activities to gain insights into your productivity patterns.";
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="bg-gradient-to-r from-[#2B4474] to-[#3A5A9B] p-6 text-white">
        <h2 className="mb-4 text-xl font-semibold">Focus Summary</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#E5A853]" />
              <div>
                <p className="text-sm font-medium text-gray-100">Total Focus Time</p>
                <p className="text-2xl font-bold">{formatTime(totalFocusTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[#E5A853]" />
              <div>
                <p className="text-sm font-medium text-gray-100">Completed Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart className="h-5 w-5 text-[#E5A853]" />
              <div>
                <p className="text-sm font-medium text-gray-100">Productivity</p>
                <p className="text-2xl font-bold">{productivityPercentage}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#E5A853]" />
                  <p className="text-sm font-medium text-gray-100">Classification Progress</p>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(classificationProgress * 100)}%
                </span>
              </div>
              <Progress
                value={classificationProgress * 100}
                className="h-2 bg-white/20"
                indicatorClassName="bg-[#E5A853]"
              />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="bg-white p-6 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-[#E5A853] p-2">
            <Tag className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300">{getMotivationalMessage()}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Sparkles className="h-4 w-4 text-[#E5A853]" />
              <p>
                Classification rules are automatically created when you classify apps or domains
              </p>
              <RulesInfo />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

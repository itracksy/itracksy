/**
 * Analytics Dashboard
 *
 * Three-Layer Progressive Disclosure:
 * - Layer 1: Pulse - Immediate feedback (Focus Score)
 * - Layer 2: Day Review - Tactical insight (Timeline, Categories, Top Apps)
 * - Layer 3: Deep Dive - Strategic analysis (Trends, Peak Hours, Insights)
 */

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedAnalyticsTimeRangeAtom, selectedAnalyticsBoardIdAtom } from "@/context/timeRange";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { AnalyticsBoardSelector } from "./components/AnalyticsBoardSelector";
import { FocusPulse } from "./components/FocusPulse";
import { DayTimeline } from "./components/DayTimeline";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { TopApps } from "./components/TopApps";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { FocusTrends } from "./components/FocusTrends";
import { PeakHoursAnalysis } from "./components/PeakHoursAnalysis";
import { ProductivityInsights } from "./components/ProductivityInsights";
import { BarChart3, Calendar, Clock, Layers } from "lucide-react";

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedAnalyticsTimeRangeAtom);
  const [selectedBoardId] = useAtom(selectedAnalyticsBoardIdAtom);
  const [activeTab, setActiveTab] = useState<"overview" | "deep-dive">("overview");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Analytics</h1>
          <div className="flex items-center gap-2">
            <AnalyticsBoardSelector />
            <TimeRangeSelector
              start={selectedTimeRange.start}
              end={selectedTimeRange.end}
              value={selectedTimeRange.value}
              onRangeChange={setSelectedTimeRange}
            />
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="h-full"
        >
          <div className="border-b px-4">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="gap-1.5 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Layers className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="deep-dive"
                className="gap-1.5 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <BarChart3 className="h-4 w-4" />
                Deep Dive
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Layer 1 & 2: Overview Tab */}
          <TabsContent value="overview" className="mt-0 p-4">
            <div className="space-y-6">
              {/* Layer 1: The Pulse */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-primary" />
                    Today's Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FocusPulse timeRange={selectedTimeRange} boardId={selectedBoardId} />
                </CardContent>
              </Card>

              {/* Layer 2: Day Review */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Timeline - spans 2 columns */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DayTimeline timeRange={selectedTimeRange} boardId={selectedBoardId} />
                  </CardContent>
                </Card>

                {/* Top Apps */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Apps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TopApps timeRange={selectedTimeRange} boardId={selectedBoardId} />
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown & Heatmap */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Time by Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryBreakdown timeRange={selectedTimeRange} boardId={selectedBoardId} />
                  </CardContent>
                </Card>

                <ActivityHeatmap />
              </div>
            </div>
          </TabsContent>

          {/* Layer 3: Deep Dive Tab */}
          <TabsContent value="deep-dive" className="mt-0 p-4">
            <div className="space-y-6">
              {/* Focus Trends - Full Width */}
              <FocusTrends timeRange={selectedTimeRange} boardId={selectedBoardId} />

              {/* Peak Hours & Insights */}
              <div className="grid gap-4 lg:grid-cols-2">
                <PeakHoursAnalysis timeRange={selectedTimeRange} boardId={selectedBoardId} />
                <ProductivityInsights timeRange={selectedTimeRange} boardId={selectedBoardId} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import HourlyFocusChart from "./components/HourlyFocusChart";
import ProjectTimeChart from "./components/ProjectTimeChart";
import FocusPerformanceChart from "./components/FocusPerformanceChart";
import TimeRangeSelector from "@/components/TimeRangeSelector";

import { useAtom } from "jotai";
import { selectedAnalyticsTimeRangeAtom } from "@/context/timeRange";

export default function DashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useAtom(selectedAnalyticsTimeRangeAtom);

  return (
    <div className="min-h-screen bg-gradient-to-br from-tracksy-blue/5 to-tracksy-gold/5 dark:from-tracksy-blue/10 dark:to-tracksy-gold/10">
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-tracksy-blue dark:text-white">
              Activity Dashboard
              <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
            </h1>
            <TimeRangeSelector
              start={selectedTimeRange.start}
              end={selectedTimeRange.end}
              value={selectedTimeRange.value}
              onRangeChange={setSelectedTimeRange}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <FocusPerformanceChart timeRange={selectedTimeRange} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProjectTimeChart timeRange={selectedTimeRange} />
            <HourlyFocusChart timeRange={selectedTimeRange} />
          </div>
        </div>
      </div>
    </div>
  );
}

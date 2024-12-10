import { TrackingControls } from "@/components/tracking/TrackingControls";
import {
  ActivityRecord,
  ApplicationDurationReport,
  calculateApplicationDurations,
} from "@/types/activity";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { WorkblockTimeline } from "./components/WorkblockTimeline";

export default function DashboardPage() {
  const [activeWindow, setActiveWindow] = useState<ActivityRecord[]>([]);
  const [appUsageData, setAppUsageData] = useState<{ name: string; duration: number }[]>([]);
  const [durationReports, setDurationReports] = useState<ApplicationDurationReport[]>([]);
  useEffect(() => {
    const fetchActiveWindow = async () => {
      try {
        const result = await window.electronWindow.getActiveWindow();
        setActiveWindow(result);
      } catch (error) {
        console.error("Failed to fetch active window:", error);
      }
    };

    // Fetch initially
    fetchActiveWindow();

    // Set up polling every few seconds (adjust interval as needed)
    const interval = setInterval(fetchActiveWindow, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const processActivityData = () => {
      // Calculate durations for the last 24 hours
      const timeWindow = {
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now(),
      };

      const durationReports = calculateApplicationDurations(activeWindow, timeWindow);

      // Convert the duration reports to the format expected by charts
      const appUsage = durationReports.map((report) => ({
        name: report.applicationName,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
      }));
      setDurationReports(durationReports);
      setAppUsageData(appUsage.sort((a, b) => b.duration - a.duration).slice(0, 5));
    };

    processActivityData();
  }, [activeWindow]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Dashboard</h1>
        <TrackingControls />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Workblock Timeline */}
        <div className="md:col-span-1">
          <WorkblockTimeline reports={durationReports} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 md:col-span-2">
          {/* Bar Chart */}
          <div className="rounded-lg bg-gray-900 p-4 shadow">
            <h2 className="mb-4 text-xl font-semibold">Top Applications Usage</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="duration" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

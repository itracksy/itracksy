import {
  ActivityRecord,
  ApplicationDurationReport,
  DomainDurationReport,
  TitleDurationReport,
  CategoryDurationReport,
} from "@/types/activity";
import { useState, useEffect, useMemo } from "react";

import { calculateDurationsReport } from "@/services/ReportBuilder";
import TimeBreakdown from "./components/TimeBreakDown";
import { CategoryMapper } from "@/services/CategoryMapper";
import { CategoryTreeView } from "./components/CategoryTreeView";

export default function DashboardPage() {
  const [activeWindow, setActiveWindow] = useState<ActivityRecord[]>([]);
  const [durationReports, setDurationReports] = useState<{
    applications: ApplicationDurationReport[];
    domains: DomainDurationReport[];
    titles: TitleDurationReport[];
  }>({ applications: [], domains: [], titles: [] });
  const [categoryReport, setCategoryReport] = useState<CategoryDurationReport[]>([]);

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

      const durationReports = calculateDurationsReport(activeWindow, timeWindow);
      setDurationReports(durationReports);
    };

    processActivityData();
  }, [activeWindow]);

  useEffect(() => {
    const categoryMapper = new CategoryMapper();
    const categories = categoryMapper.buildCategoryTree(activeWindow);
    setCategoryReport(categories);
  }, [activeWindow]);

  const appUsageData = useMemo(
    () =>
      durationReports.applications.map((report) => ({
        name: report.applicationName,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.applications.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.applications]
  );
  const domainUsageData = useMemo(
    () =>
      durationReports.domains.map((report) => ({
        name: report.domain,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.domains.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.domains]
  );
  const titleUsageData = useMemo(
    () =>
      durationReports.titles.map((report) => ({
        name: report.title,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.titles.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.titles]
  );
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Activity Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TimeBreakdown reports={appUsageData} title="Application Usage" />
        <TimeBreakdown reports={domainUsageData} title="Domain Usage" />
        <TimeBreakdown reports={titleUsageData} title="Title Usage" />
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-xl font-semibold">Category Breakdown</h2>
        <div className="rounded-lg p-4 shadow">
          <CategoryTreeView categories={categoryReport} />
        </div>
      </div>
    </div>
  );
}

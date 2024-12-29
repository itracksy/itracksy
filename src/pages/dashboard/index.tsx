import {
  ApplicationDurationReport,
  DomainDurationReport,
  TitleDurationReport,
  CategoryDurationReport,
  ActivityRecord,
} from "@/types/activity";
import { useState, useEffect, useMemo } from "react";
import { calculateDurationsReport } from "@/services/ReportBuilder";
import TimeBreakdown from "./components/TimeBreakDown";
import { CategoryMapper } from "@/services/CategoryMapper";
import { CategoryTreeView } from "./components/CategoryTreeView";
import { BoardReport } from "./components/BoardReport";
import { useAtom } from "jotai";
import { accessibilityPermissionAtom, screenRecordingPermissionAtom } from "@/context/activity";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const [durationReports, setDurationReports] = useState<{
    applications: ApplicationDurationReport[];
    domains: DomainDurationReport[];
    titles: TitleDurationReport[];
  }>({ applications: [], domains: [], titles: [] });
  const [categoryReport, setCategoryReport] = useState<CategoryDurationReport[]>([]);
  const [accessibilityPermission, setAccessibilityPermission] = useAtom(
    accessibilityPermissionAtom
  );
  const [screenRecordingPermission, setScreenRecordingPermission] = useAtom(
    screenRecordingPermissionAtom
  );

  const { data: activityWindow } = useQuery({
    queryKey: ["activityWindow"],
    queryFn: async () => {
      return window.electronWindow.getActivities();
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!activityWindow) {
      return;
    }
    // Calculate durations for the last 24 hours
    const timeWindow = {
      start: Date.now() - 24 * 60 * 60 * 1000,
      end: Date.now(),
    };

    const durationReports = calculateDurationsReport(activityWindow, timeWindow);
    setDurationReports(durationReports);
  }, [activityWindow]);

  useEffect(() => {
    if (!activityWindow) {
      return;
    }
    const categoryMapper = new CategoryMapper();
    const categories = categoryMapper.buildCategoryTree(activityWindow);
    setCategoryReport(categories);
  }, [activityWindow]);

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
      <h1 className="text-2xl font-bold">Activity Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <BoardReport />
      </div>
      <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <TimeBreakdown reports={appUsageData} title="Application Usage" />
        <TimeBreakdown
          reports={domainUsageData}
          title="Domain Usage"
          permissionDisabled={!accessibilityPermission}
          onEnablePermission={async () => {
            setAccessibilityPermission(true);
          }}
        />
        <TimeBreakdown
          reports={titleUsageData}
          title="Title Usage"
          permissionDisabled={!screenRecordingPermission}
          onEnablePermission={async () => {
            setScreenRecordingPermission(true);
          }}
        />
        <div className="">
          <CategoryTreeView categories={categoryReport} />
        </div>
      </div>
    </div>
  );
}

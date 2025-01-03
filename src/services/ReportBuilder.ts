import {
  ApplicationDurationReport,
  DomainDurationReport,
  TitleDurationReport,
} from "@/types/activity";
import { ActivityRecord } from "@/types/activity";
import { TRACKING_INTERVAL } from "@/config/tracking";

const MAX_ITEMS_PER_REPORT = 7;

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "unknown";
  }
}

export function calculateDurationsReport(
  records: ActivityRecord[],
  timeWindow: { start: number; end: number }
): {
  applications: ApplicationDurationReport[];
  domains: DomainDurationReport[];
  titles: TitleDurationReport[];
} {
  // Sort records by timestamp
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

  // Group records by application name and domains
  const groupedByApp = new Map<string, ActivityRecord[]>();
  const groupedByDomain = new Map<string, ActivityRecord[]>();
  const groupedByTitle = new Map<string, ActivityRecord[]>();

  sortedRecords.forEach((record) => {
    if (record.timestamp >= timeWindow.start && record.timestamp <= timeWindow.end) {
      const appName = record.ownerName;

      // Group by application
      if (!groupedByApp.has(appName)) {
        groupedByApp.set(appName, []);
      }
      groupedByApp.get(appName)!.push(record);

      // Group by domain if URL exists
      if (record.url) {
        const domain = extractDomain(record.url);
        if (!groupedByDomain.has(domain)) {
          groupedByDomain.set(domain, []);
        }
        groupedByDomain.get(domain)!.push(record);
      }

      // Group by title if it's not a browser record and title is not empty
      if (!record.url && record.title.trim()) {
        const title = record.title;
        if (!groupedByTitle.has(title)) {
          groupedByTitle.set(title, []);
        }
        groupedByTitle.get(title)!.push(record);
      }
    }
  });

  // Calculate durations helper function
  const calculateDurations = (records: ActivityRecord[]) => {
    const instances: { startTime: number; endTime: number; duration: number }[] = [];
    let currentInstance = {
      startTime: records[0].timestamp,
      endTime: records[0].timestamp,
      duration: records[0].count * TRACKING_INTERVAL,
    };

    const GAP_THRESHOLD = 5000;

    for (let i = 1; i < records.length; i++) {
      const timeDiff = records[i].timestamp - records[i - 1].timestamp;

      if (timeDiff > GAP_THRESHOLD) {
        instances.push(currentInstance);
        currentInstance = {
          startTime: records[i].timestamp,
          endTime: records[i].timestamp,
          duration: records[i].count * TRACKING_INTERVAL,
        };
      } else {
        currentInstance.endTime = records[i].timestamp;
        currentInstance.duration += records[i].count * TRACKING_INTERVAL;
      }
    }

    instances.push(currentInstance);

    return instances;
  };

  // Calculate application reports with percentage
  const applicationReports: ApplicationDurationReport[] = Array.from(groupedByApp)
    .map(([appName, appRecords]) => {
      const instances = calculateDurations(appRecords);
      const totalDuration = instances.reduce((sum, inst) => sum + inst.duration, 0);
      return { applicationName: appName, totalDuration, instances, percentage: 0 };
    })
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .slice(0, MAX_ITEMS_PER_REPORT);

  // Calculate total duration for percentage
  const totalAppDuration = applicationReports.reduce(
    (sum, report) => sum + report.totalDuration,
    0
  );
  applicationReports.forEach((report) => {
    report.percentage = (report.totalDuration / totalAppDuration) * 100;
  });

  // Calculate domain reports with percentage
  const domainReports: DomainDurationReport[] = Array.from(groupedByDomain)
    .map(([domain, domainRecords]) => {
      const instances = calculateDurations(domainRecords);
      const totalDuration = instances.reduce((sum, inst) => sum + inst.duration, 0);
      return { domain, totalDuration, instances, percentage: 0 };
    })
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .slice(0, MAX_ITEMS_PER_REPORT);

  const totalDomainDuration = domainReports.reduce((sum, report) => sum + report.totalDuration, 0);
  domainReports.forEach((report) => {
    report.percentage = (report.totalDuration / totalDomainDuration) * 100;
  });

  // Calculate title reports with percentage
  const titleReports: TitleDurationReport[] = Array.from(groupedByTitle)
    .map(([title, titleRecords]) => {
      const instances = calculateDurations(titleRecords);
      const totalDuration = instances.reduce((sum, inst) => sum + inst.duration, 0);
      return { title, totalDuration, instances, percentage: 0 };
    })
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .slice(0, MAX_ITEMS_PER_REPORT);

  const totalTitleDuration = titleReports.reduce((sum, report) => sum + report.totalDuration, 0);
  titleReports.forEach((report) => {
    report.percentage = (report.totalDuration / totalTitleDuration) * 100;
  });

  return { applications: applicationReports, domains: domainReports, titles: titleReports };
}

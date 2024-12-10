export interface ActivityRecord {
  platform: string;
  id: number;
  bounds: {
    width: number;
    y: number;
    height: number;
    x: number;
  };
  title: string;
  owner: {
    path: string;
    processId: number;
    bundleId?: string;
    name: string;
  };
  memoryUsage: number;
  timestamp: number;
}

export interface ApplicationDurationReport {
  applicationName: string;
  totalDuration: number; // in milliseconds
  instances: {
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

export function calculateApplicationDurations(
  records: ActivityRecord[],
  timeWindow: { start: number; end: number }
): ApplicationDurationReport[] {
  // Sort records by timestamp
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

  // Group records by application name
  const groupedByApp = new Map<string, ActivityRecord[]>();

  sortedRecords.forEach((record) => {
    if (record.timestamp >= timeWindow.start && record.timestamp <= timeWindow.end) {
      const appName = record.owner.name;
      if (!groupedByApp.has(appName)) {
        groupedByApp.set(appName, []);
      }
      groupedByApp.get(appName)!.push(record);
    }
  });

  // Calculate durations for each application
  const reports: ApplicationDurationReport[] = [];

  groupedByApp.forEach((appRecords, appName) => {
    const instances: { startTime: number; endTime: number; duration: number }[] = [];
    let currentInstance = {
      startTime: appRecords[0].timestamp,
      endTime: appRecords[0].timestamp,
    };

    // Group consecutive records (gap threshold of 5 seconds)
    const GAP_THRESHOLD = 5000; // 5 seconds in milliseconds

    for (let i = 1; i < appRecords.length; i++) {
      const timeDiff = appRecords[i].timestamp - appRecords[i - 1].timestamp;

      if (timeDiff > GAP_THRESHOLD) {
        // Save current instance and start a new one
        instances.push({
          ...currentInstance,
          duration: currentInstance.endTime - currentInstance.startTime,
        });
        currentInstance = {
          startTime: appRecords[i].timestamp,
          endTime: appRecords[i].timestamp,
        };
      } else {
        // Continue current instance
        currentInstance.endTime = appRecords[i].timestamp;
      }
    }

    // Add the last instance
    instances.push({
      ...currentInstance,
      duration: currentInstance.endTime - currentInstance.startTime,
    });

    // Calculate total duration
    const totalDuration = instances.reduce((sum, inst) => sum + inst.duration, 0);

    reports.push({
      applicationName: appName,
      totalDuration,
      instances,
    });
  });

  return reports;
}

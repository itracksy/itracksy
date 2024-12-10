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
  url?: string;
  timestamp: number;
}

export interface ApplicationDurationReport {
  applicationName: string;
  totalDuration: number; // in milliseconds
  percentage: number;
  instances: {
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

export interface DomainDurationReport {
  domain: string;
  totalDuration: number;
  percentage: number;
  instances: {
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

export interface TitleDurationReport {
  title: string;
  totalDuration: number;
  percentage: number;
  instances: {
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

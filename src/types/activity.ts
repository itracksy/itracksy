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

export interface CategoryTree {
  name: string;
  duration: number; // in milliseconds
  children?: CategoryTree[];
}

export interface CategoryRule {
  category: string[]; // e.g. ['Work', 'Programming', 'ActivityWatch']
  matches: {
    application?: string;
    title?: RegExp;
    domain?: string;
  };
}

export interface CategoryDurationReport {
  category: string[];
  totalDuration: number;
  percentage: number;
  children: CategoryDurationReport[];
  instances: {
    startTime: number;
    endTime: number;
    duration: number;
  }[];
}

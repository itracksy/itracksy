export interface ActivityRecord {
  platform: string;
  activityId: number;
  title: string;
  ownerPath: string;
  ownerProcessId: number;
  ownerBundleId?: string;
  ownerName: string;
  url?: string;
  timestamp: number; // timestamp: Date.now() in milliseconds
  duration: number;
  userId?: string;
  taskId?: string;
  isFocused?: boolean;
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

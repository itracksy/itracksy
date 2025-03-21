import { activities, activityRules } from "@/api/db/schema";

export type Activity = typeof activities.$inferInsert;

export type ActivityRule = typeof activityRules.$inferSelect;

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

export type GroupActivity = {
  appName: string;
  rule?: ActivityRule;
  totalDuration: number;
  domains: Record<
    string,
    {
      domain: string;
      activities: Activity[];
      totalDuration: number;
      rule?: ActivityRule;
    }
  >;
  activitiesWithoutUrl: Activity[];
};

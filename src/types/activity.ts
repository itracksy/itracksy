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

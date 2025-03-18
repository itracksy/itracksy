import { Activity } from "@/types/activity";

// Helper function to extract domain from URL
export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (e) {
    return url;
  }
}

// Helper function to group activities
export function groupActivities(activities: Activity[]) {
  const appGroups: Record<
    string,
    {
      appName: string;
      totalDuration: number;
      domains: Record<
        string,
        {
          domain: string;
          activities: Activity[];
          totalDuration: number;
        }
      >;
      activitiesWithoutUrl: Activity[];
    }
  > = {};

  activities.forEach((activity) => {
    const appName = activity.ownerName;

    // Initialize app group if it doesn't exist
    if (!appGroups[appName]) {
      appGroups[appName] = {
        appName,
        totalDuration: 0,
        domains: {},
        activitiesWithoutUrl: [],
      };
    }

    appGroups[appName].totalDuration += activity.duration;

    if (activity.url) {
      const domain = extractDomain(activity.url);

      // Initialize domain group if it doesn't exist
      if (!appGroups[appName].domains[domain]) {
        appGroups[appName].domains[domain] = {
          domain,
          activities: [],
          totalDuration: 0,
        };
      }

      appGroups[appName].domains[domain].activities.push(activity);
      appGroups[appName].domains[domain].totalDuration += activity.duration;
    } else {
      appGroups[appName].activitiesWithoutUrl.push(activity);
    }
  });

  return appGroups;
}

import { Activity } from "@/types/activity";

import { extractDomain, urlContainsDomain } from "./url";
import { isEmpty } from "./value-checks";
import { RuleFormValues } from "@/types/rule";

/**
 * Checks if an activity matches a rule based on the rule's criteria
 * @param activity The activity to check
 * @param rule The rule to match against
 * @returns true if the activity matches the rule, false otherwise
 */
export function doesActivityMatchRule(activity: Activity, rule: RuleFormValues): boolean {
  const isDurationValid = ({
    duration,
    condition,
  }: {
    duration?: number;
    condition?: string | null;
  }): boolean => {
    if (duration == null || duration <= 0) {
      return true;
    }
    if (condition === ">") {
      return activity.duration > duration;
    } else if (condition === "<") {
      return activity.duration < duration;
    } else if (condition === "=") {
      return activity.duration === duration;
    }
    return false;
  };
  const isTitleValid = ({
    title,
    condition,
  }: {
    title?: string;
    condition?: string | null;
  }): boolean => {
    if (!title || isEmpty(title)) {
      return true;
    }
    if (condition === "contains") {
      return activity.title.includes(title);
    } else if (condition === "equals") {
      return activity.title === title;
    } else if (condition === "startsWith") {
      return activity.title.startsWith(title);
    } else if (condition === "endsWith") {
      return activity.title.endsWith(title);
    }
    return false;
  };

  const isAppNameValid = (appName: string): boolean => {
    return activity.ownerName === appName;
  };

  /**
   * Check if the activity's domain matches the rule's domain.
   * Uses domain containment logic, so:
   * - "youtube.com" will match both "youtube.com" and "youtube.com/watch?v=abc123"
   * - "google.com" will match "mail.google.com", "drive.google.com", etc.
   */
  const isDomainValid = (domain?: string): boolean => {
    if (isEmpty(domain)) {
      return true;
    }
    return urlContainsDomain(activity.url, domain!);
  };

  return (
    isAppNameValid(rule.appName) &&
    isDomainValid(rule.domain) &&
    isTitleValid({ title: rule.title, condition: rule.titleCondition }) &&
    isDurationValid({ duration: rule.duration, condition: rule.durationCondition })
  );
}

/**
 * Find all activities that match a specific rule
 * @param activities The list of activities to search
 * @param rule The rule to match against
 * @returns An array of activities that match the rule
 */
export function findActivitiesMatchingRule(
  activities: Activity[],
  rule: RuleFormValues
): Activity[] {
  return activities.filter((activity) => doesActivityMatchRule(activity, rule));
}

import { Activity } from "@/types/activity";
import { RuleFormValues } from "@/components/rules/rule-dialog";
import { extractDomain } from "./url";

/**
 * Checks if an activity matches a rule based on the rule's criteria
 * @param activity The activity to check
 * @param rule The rule to match against
 * @returns true if the activity matches the rule, false otherwise
 */
export function doesActivityMatchRule(activity: Activity, rule: RuleFormValues): boolean {
  // Match by app name
  if (rule.appName && rule.appName.trim() !== "") {
    return activity.ownerName === rule.appName;
  }

  // Match by domain
  else if (rule.domain && rule.domain.trim() !== "" && activity.url) {
    return extractDomain(activity.url) === rule.domain;
  }

  // Match by title
  else if (rule.titleCondition && rule.title && rule.title.trim() !== "" && activity.title) {
    if (rule.titleCondition === "contains") {
      return activity.title.includes(rule.title);
    } else if (rule.titleCondition === "equals") {
      return activity.title === rule.title;
    } else if (rule.titleCondition === "startsWith") {
      return activity.title.startsWith(rule.title);
    } else if (rule.titleCondition === "endsWith") {
      return activity.title.endsWith(rule.title);
    }
  }

  // Match by duration
  else if (rule.durationCondition && rule.duration) {
    const durationValue = rule.duration;

    if (rule.durationCondition === ">") {
      return activity.duration > durationValue;
    } else if (rule.durationCondition === "<") {
      return activity.duration < durationValue;
    } else if (rule.durationCondition === "=") {
      return activity.duration === durationValue;
    } else if (rule.durationCondition === ">=") {
      return activity.duration >= durationValue;
    } else if (rule.durationCondition === "<=") {
      return activity.duration <= durationValue;
    }
  }

  return false;
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

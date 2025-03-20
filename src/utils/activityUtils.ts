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
  if (rule.ruleType === "app_name") {
    return activity.ownerName === rule.value;
  } else if (rule.ruleType === "domain" && activity.url) {
    return extractDomain(activity.url) === rule.value;
  } else if (rule.ruleType === "url" && activity.url) {
    if (rule.condition === "contains") {
      return activity.url.includes(rule.value);
    } else if (rule.condition === "=") {
      return activity.url === rule.value;
    } else if (rule.condition === "startsWith") {
      return activity.url.startsWith(rule.value);
    } else if (rule.condition === "endsWith") {
      return activity.url.endsWith(rule.value);
    }
  } else if (rule.ruleType === "title" && activity.title) {
    if (rule.condition === "contains") {
      return activity.title.includes(rule.value);
    } else if (rule.condition === "=") {
      return activity.title === rule.value;
    } else if (rule.condition === "startsWith") {
      return activity.title.startsWith(rule.value);
    } else if (rule.condition === "endsWith") {
      return activity.title.endsWith(rule.value);
    }
  } else if (rule.ruleType === "duration") {
    const durationValue = parseFloat(rule.value);
    if (isNaN(durationValue)) return false;

    if (rule.condition === ">") {
      return activity.duration > durationValue;
    } else if (rule.condition === "<") {
      return activity.duration < durationValue;
    } else if (rule.condition === "=") {
      return activity.duration === durationValue;
    } else if (rule.condition === ">=") {
      return activity.duration >= durationValue;
    } else if (rule.condition === "<=") {
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

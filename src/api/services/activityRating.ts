import { eq, and, isNull } from "drizzle-orm";

import { activities, activityRules } from "../db/schema";
import db from "../db";
import { Activity, ActivityRule } from "@/types/activity";
import { extractDomain } from "../../utils/url";

export type RuleCondition = ">" | "<" | "=" | ">=" | "<=" | "contains" | "startsWith" | "endsWith";
export type RuleType = "duration" | "app_name" | "domain" | "title" | "url";

export interface RatingResult {
  activityId: number;
  timestamp: number;
  rating: number; // 0 = bad, 1 = good
  appliedRules: ActivityRule[];
}

/**
 * Rate an activity based on defined rules
 */
export async function rateActivity(activityData: Activity): Promise<RatingResult> {
  // Get all active rules for the user
  const rules = await db.query.activityRules.findMany({
    where: and(eq(activityRules.userId, activityData.userId), eq(activityRules.active, true)),
  });

  const appliedRules = evaluateRules(activityData, rules);

  // If no rules matched, return null (unrated)
  if (appliedRules.length === 0) {
    return {
      activityId: activityData.activityId,
      timestamp: activityData.timestamp,
      rating: -1, // -1 means unrated
      appliedRules: [],
    };
  }

  // For simplicity, we'll use the first matching rule's rating
  // This could be enhanced with rule priority or more complex logic
  const rating = appliedRules[0].rating;

  // Update the activity with the rating
  await db
    .update(activities)
    .set({ rating })
    .where(eq(activities.timestamp, activityData.timestamp));

  return {
    activityId: activityData.activityId,
    timestamp: activityData.timestamp,
    rating,
    appliedRules,
  };
}

/**
 * Find rules that apply to an activity
 */
function evaluateRules(activity: Activity, rules: ActivityRule[]): ActivityRule[] {
  return rules.filter((rule) => {
    switch (rule.ruleType) {
      case "duration":
        return evaluateDurationRule(activity.duration, rule.condition as RuleCondition, rule.value);

      case "app_name":
        return evaluateStringRule(activity.ownerName, rule.condition as RuleCondition, rule.value);

      case "domain":
        return activity.url
          ? evaluateStringRule(
              extractDomain(activity.url) ?? "",
              rule.condition as RuleCondition,
              rule.value
            )
          : false;

      case "title":
        return evaluateStringRule(activity.title, rule.condition as RuleCondition, rule.value);

      case "url":
        return activity.url
          ? evaluateStringRule(activity.url, rule.condition as RuleCondition, rule.value)
          : false;

      default:
        return false;
    }
  });
}

/**
 * Apply numeric conditions
 */
function evaluateDurationRule(duration: number, condition: RuleCondition, value: string): boolean {
  const numValue = parseInt(value, 10);

  switch (condition) {
    case ">":
      return duration > numValue;
    case "<":
      return duration < numValue;
    case "=":
      return duration === numValue;
    case ">=":
      return duration >= numValue;
    case "<=":
      return duration <= numValue;
    default:
      return false;
  }
}

/**
 * Apply string conditions
 */
function evaluateStringRule(text: string, condition: RuleCondition, value: string): boolean {
  switch (condition) {
    case "contains":
      return text.includes(value);
    case "startsWith":
      return text.startsWith(value);
    case "endsWith":
      return text.endsWith(value);
    case "=":
      return text === value;
    default:
      return false;
  }
}

/**
 * Bulk rate activities for a user
 */
export async function rateUserActivities(userId: string): Promise<RatingResult[]> {
  // Get unrated activities for the user
  const unratedActivities = await db.query.activities.findMany({
    where: and(eq(activities.userId, userId), isNull(activities.rating)),
  });

  const results: RatingResult[] = [];

  for (const activity of unratedActivities) {
    results.push(await rateActivity(activity));
  }

  return results;
}

import { eq, and } from "drizzle-orm";
import db from "../db";
import { activityRules } from "../db/schema";
import { nanoid } from "nanoid";
import { RuleCondition, RuleType } from "./activityRating";
import { Activity, ActivityRule, GroupActivity } from "@/types/activity";

import { extractDomain } from "../../utils/url";

export interface CreateRuleParams {
  name: string;
  description?: string;
  ruleType: RuleType;
  condition: RuleCondition;
  value: string;
  rating: number; // 0 = bad, 1 = good
  userId: string;
  active?: boolean;
  appName?: string;
  domain?: string;
}

/**
 * Create a new activity rule
 */
export async function createRule(params: CreateRuleParams) {
  const now = Date.now();

  const rule = await db
    .insert(activityRules)
    .values({
      id: nanoid(),
      name: params.name,
      description: params.description || null,
      ruleType: params.ruleType,
      condition: params.condition,
      value: params.value,
      rating: params.rating,
      userId: params.userId,
      createdAt: now,
      active: params.active !== undefined ? params.active : true,
    })
    .returning();

  return rule[0];
}

/**
 * Get all rules for a user
 */
export async function getUserRules(userId: string) {
  return await db.query.activityRules.findMany({
    where: eq(activityRules.userId, userId),
    orderBy: (rules, { desc }) => [desc(rules.createdAt)],
  });
}

/**
 * Update an existing rule
 */
export async function updateRule(
  ruleId: string,
  userId: string,
  updates: Partial<Omit<CreateRuleParams, "userId">>
) {
  const result = await db
    .update(activityRules)
    .set(updates)
    .where(and(eq(activityRules.id, ruleId), eq(activityRules.userId, userId)))
    .returning();

  return result[0];
}

/**
 * Delete a rule
 */
export async function deleteRule(ruleId: string, userId: string) {
  return await db
    .delete(activityRules)
    .where(and(eq(activityRules.id, ruleId), eq(activityRules.userId, userId)));
}

/**
 * Toggle rule active state
 */
export async function toggleRuleActive(ruleId: string, userId: string, active: boolean) {
  return await db
    .update(activityRules)
    .set({ active })
    .where(and(eq(activityRules.id, ruleId), eq(activityRules.userId, userId)));
}

/**
 * Create default rules for new users
 */
export async function createDefaultRules(userId: string) {
  const defaultRules: CreateRuleParams[] = [
    {
      name: "Long activity",
      description: "Activities lasting over 25 minutes are productive",
      ruleType: "duration",
      condition: ">",
      value: "1500", // 25 * 60 seconds
      rating: 1, // good
      userId,
    },
    {
      name: "Very short activity",
      description: "Activities under 30 seconds are likely distractions",
      ruleType: "duration",
      condition: "<",
      value: "30",
      rating: 0, // bad
      userId,
    },
  ];

  for (const rule of defaultRules) {
    await createRule(rule);
  }
}

export async function getGroupActivities(activities: Activity[]) {
  const appGroups: Record<string, GroupActivity> = {};

  for (const activity of activities) {
    const appName = activity.ownerName;

    // Initialize app group if it doesn't exist
    if (!appGroups[appName]) {
      const rule = await db
        .select()
        .from(activityRules)
        .where(and(eq(activityRules.ruleType, "app_name"), eq(activityRules.value, appName)))
        .get();
      console.log(appName, rule);
      appGroups[appName] = {
        appName,
        totalDuration: 0,
        domains: {},
        activitiesWithoutUrl: [],
        rule,
      };
    }

    appGroups[appName].totalDuration += activity.duration;

    if (activity.url) {
      const domain = extractDomain(activity.url);
      if (!domain) {
        console.log("No domain found for URL", activity.url);
        continue;
      }
      // Initialize domain group if it doesn't exist
      if (!appGroups[appName].domains[domain]) {
        const rule = await db
          .select()
          .from(activityRules)
          .where(and(eq(activityRules.ruleType, "domain"), eq(activityRules.value, domain)))
          .get();
        console.log(domain, rule);
        appGroups[appName].domains[domain] = {
          domain,
          activities: [],
          totalDuration: 0,
          rule,
        };
      }

      appGroups[appName].domains[domain].activities.push(activity);
      appGroups[appName].domains[domain].totalDuration += activity.duration;
    } else {
      appGroups[appName].activitiesWithoutUrl.push(activity);
    }
  }
  console.log("appGroups", appGroups);
  return appGroups;
}

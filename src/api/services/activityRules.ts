import { eq, and, or } from "drizzle-orm";
import db from "../db";
import { activityRules } from "../db/schema";
import { nanoid } from "nanoid";

import { Activity, ActivityRule, GroupActivity } from "@/types/activity";

import { extractDomain } from "../../utils/url";

/**
 * Create a new activity rule
 */
export async function createRule(params: Omit<ActivityRule, "id" | "createdAt">) {
  const now = Date.now();

  const rule = await db
    .insert(activityRules)
    .values({
      id: nanoid(),
      name: params.name,
      description: params.description || null,
      appName: params.appName,
      domain: params.domain || "",
      title: params.title || "",
      titleCondition: params.titleCondition || "",
      duration: params.duration || 0,
      durationCondition: params.durationCondition || null,
      rating: params.rating,
      userId: params.userId,
      createdAt: now,
      active: params.active !== undefined ? params.active : true,
    })
    .onConflictDoUpdate({
      target: [
        activityRules.userId,
        activityRules.title,
        activityRules.appName,
        activityRules.domain,
      ],
      set: {
        name: params.name,
        description: params.description || null,
        titleCondition: params.titleCondition || "",
        duration: params.duration || 0,
        durationCondition: params.durationCondition || null,
        rating: params.rating,
        active: params.active !== undefined ? params.active : true,
      },
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

export async function getRuleById({ ruleId, userId }: { ruleId: string; userId: string }) {
  return await db
    .select()
    .from(activityRules)
    .where(and(eq(activityRules.id, ruleId), eq(activityRules.userId, userId)))
    .get();
}
/**
 * Update an existing rule
 */
export async function updateRule(
  ruleId: string,
  userId: string,
  updates: Partial<Omit<ActivityRule, "userId">>
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

export async function getGroupActivities(activities: Activity[]) {
  const appGroups: Record<string, GroupActivity> = {};

  for (const activity of activities) {
    const appName = activity.ownerName;

    // Initialize app group if it doesn't exist
    if (!appGroups[appName]) {
      const rule = await db
        .select()
        .from(activityRules)
        .where(and(eq(activityRules.appName, appName)))
        .get();

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
          .where(and(eq(activityRules.domain, domain)))
          .get();

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

  return appGroups;
}

// find rules that match the activity
export async function findMatchingDistractingRules(activity: Activity) {
  const rule = await db.query.activityRules.findFirst({
    where: (rules) => {
      return and(
        eq(rules.userId, activity.userId),
        eq(rules.active, true),
        activity.url
          ? eq(rules.domain, extractDomain(activity.url) || "")
          : eq(rules.appName, activity.ownerName)
      );
    },
  });

  return rule;
}

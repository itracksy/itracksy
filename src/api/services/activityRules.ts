import { eq, and } from "drizzle-orm";
import db from "../db";
import { activityRules } from "../db/schema";
import { nanoid } from "nanoid";
import { RuleCondition, RuleType } from "./activityRating";

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

import { z } from "zod";

/**
 * Title matching condition types
 */
export type TitleCondition = "contains" | "startsWith" | "endsWith" | "equals" | "=" | "" | null;

/**
 * Duration comparison condition types
 */
export type DurationCondition = ">" | "<" | "=" | ">=" | "<=" | "" | null;

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const ruleFormSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),

  // Title rule fields - default to "contains" for simpler UX
  titleCondition: z
    .enum(["contains", "startsWith", "endsWith", "equals", "=", ""])
    .default("contains")
    .nullable()
    .optional(),
  title: z.string().default("").optional(),

  // Duration rule fields (kept for backwards compatibility but hidden in UI)
  duration: z.number().default(0).optional(),
  durationCondition: z.enum([">", "<", "=", ">=", "<=", ""]).default("").nullable().optional(),

  // App and domain fields
  appName: z.string().default(""),
  domain: z.string().default("").optional(),

  // Common fields
  rating: z.number().min(0).max(1),
  active: z.boolean().default(true),
  activityId: z.number().optional(),
});

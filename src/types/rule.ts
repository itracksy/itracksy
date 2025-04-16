import { z } from "zod";
export type RuleFormValues = z.infer<typeof ruleFormSchema>;

export const ruleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),

  // Title rule fields
  titleCondition: z
    .enum(["contains", "startsWith", "endsWith", "equals", "=", ""])
    .default("")
    .nullable()
    .optional(),
  title: z.string().default("").optional(),

  // Duration rule fields
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

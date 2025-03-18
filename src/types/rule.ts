import { z } from "zod";

export const ruleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  ruleType: z.enum(["duration", "app_name", "domain", "title", "url"]),
  condition: z.enum([">", "<", "=", ">=", "<=", "contains", "startsWith", "endsWith"]),
  value: z.string(),
  rating: z.number().min(0).max(1),
  active: z.boolean().optional().default(true),
  appName: z.string().optional(),
  domain: z.string().optional(),
});

export type RuleFormSchema = z.infer<typeof ruleFormSchema>;

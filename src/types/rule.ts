import { z } from "zod";

export const ruleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),

  // Title rule fields
  titleCondition: z.enum(["contains", "startsWith", "endsWith", "equals", ""]).default(""),
  title: z.string().default(""),

  // Duration rule fields
  duration: z.number().default(0),
  durationCondition: z.enum([">", "<", "=", ">=", "<=", ""]).default(""),

  // App and domain fields
  appName: z.string().default(""),
  domain: z.string().default(""),

  // Common fields
  rating: z.number().min(0).max(1),
  active: z.boolean().default(true),
});

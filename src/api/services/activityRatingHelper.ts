import { Activity } from "@/types/activity";
import { CreateRuleParams } from "./activityRules";
import { RuleCondition, RuleType } from "./activityRating";
import { extractDomain } from "../../utils/url";

/**
 * Generate rule suggestions based on a rated activity
 * This helps users create rules from activities they've manually rated
 */
export function generateRuleSuggestions({
  domain,
  appName,
  title,
  duration,
  rating,
  userId,
}: {
  domain?: string;
  appName?: string;
  title?: string;
  duration?: number;
  rating: number;
  userId: string;
}): CreateRuleParams {
  // Generate title-based rule if distinctive enough (more than 5 characters)
  if (title) {
    // For titles, using "contains" is often more useful than exact matching
    return {
      domain,
      appName,
      name: `Title contains: ${title.substring(0, 30)}${title.length > 30 ? "..." : ""}`,
      description: `Activities with "${title.substring(0, 30)}${title.length > 30 ? "..." : ""}" in the title are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "title",
      condition: "contains",
      value: title.substring(0, 50), // Limit length for readability
      rating,
      userId,
    };
  }

  // Generate duration-based rule
  if (duration) {
    const durationMinutes = Math.round(duration / 60);
    const condition: RuleCondition = rating === 1 ? ">" : "<";

    return {
      name: `Duration ${condition} ${durationMinutes} minutes`,
      description: `Activities ${condition === ">" ? "longer than" : "shorter than"} ${durationMinutes} minutes are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "duration",
      condition,
      value: duration.toString(), // Store as seconds
      rating,
      userId,
    };
  }

  if (domain) {
    return {
      name: `Domain: ${domain}`,
      description: `Activities on ${domain} are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "domain",
      condition: "=",
      value: domain,
      rating,
      userId,
    };
  }
  if (appName) {
    return {
      name: `App: ${appName}`,
      description: `Activities in ${appName} are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "app_name",
      condition: "=",
      value: appName,
      rating,
      userId,
    };
  } else {
    throw new Error("No rule suggestion could be generated");
  }
}

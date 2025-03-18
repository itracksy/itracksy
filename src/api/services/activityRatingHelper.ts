import { Activity } from "@/types/activity";
import { CreateRuleParams } from "./activityRules";
import { RuleCondition, RuleType } from "./activityRating";
import { extractDomain } from "../../utils/url";

/**
 * Generate rule suggestions based on a rated activity
 * This helps users create rules from activities they've manually rated
 */
export function generateRuleSuggestions(activity: Activity, rating: number): CreateRuleParams[] {
  const suggestions: CreateRuleParams[] = [];
  const userId = activity.userId;

  // Generate app-based rule
  if (activity.ownerName) {
    suggestions.push({
      name: `App: ${activity.ownerName}`,
      description: `Activities in ${activity.ownerName} are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "app_name",
      condition: "=",
      value: activity.ownerName,
      rating,
      userId,
    });
  }

  // Generate domain-based rule if URL exists
  if (activity.url) {
    const domain = extractDomain(activity.url);
    if (domain) {
      suggestions.push({
        name: `Domain: ${domain}`,
        description: `Activities on ${domain} are ${rating === 1 ? "productive" : "distracting"}`,
        ruleType: "domain",
        condition: "=",
        value: domain,
        rating,
        userId,
      });
    }
  }

  // Generate title-based rule if distinctive enough (more than 5 characters)
  if (activity.title && activity.title.length > 5) {
    // For titles, using "contains" is often more useful than exact matching
    suggestions.push({
      name: `Title contains: ${activity.title.substring(0, 30)}${activity.title.length > 30 ? "..." : ""}`,
      description: `Activities with "${activity.title.substring(0, 30)}${activity.title.length > 30 ? "..." : ""}" in the title are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "title",
      condition: "contains",
      value: activity.title.substring(0, 50), // Limit length for readability
      rating,
      userId,
    });
  }

  // Generate duration-based rule
  if (activity.duration) {
    const durationMinutes = Math.round(activity.duration / 60);
    const condition: RuleCondition = rating === 1 ? ">" : "<";

    suggestions.push({
      name: `Duration ${condition} ${durationMinutes} minutes`,
      description: `Activities ${condition === ">" ? "longer than" : "shorter than"} ${durationMinutes} minutes are ${rating === 1 ? "productive" : "distracting"}`,
      ruleType: "duration",
      condition,
      value: activity.duration.toString(), // Store as seconds
      rating,
      userId,
    });
  }

  return suggestions;
}

/**
 * Get the best rule suggestion based on activity context
 * This is useful when you need just one suggestion instead of many
 */
export function getBestRuleSuggestion(activity: Activity, rating: number): CreateRuleParams | null {
  const suggestions = generateRuleSuggestions(activity, rating);

  if (suggestions.length === 0) {
    return null;
  }

  // Prioritize suggestions: domain > app > title > duration
  if (suggestions.find((s) => s.ruleType === "domain")) {
    return suggestions.find((s) => s.ruleType === "domain")!;
  } else if (suggestions.find((s) => s.ruleType === "app_name")) {
    return suggestions.find((s) => s.ruleType === "app_name")!;
  } else if (suggestions.find((s) => s.ruleType === "title")) {
    return suggestions.find((s) => s.ruleType === "title")!;
  } else {
    return suggestions[0]; // Default to first suggestion
  }
}

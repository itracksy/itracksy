import { Activity } from "@/types/activity";
import { RuleFormValues } from "@/types/rule";
import { doesActivityMatchRule, findActivitiesMatchingRule } from "./activityUtils";

describe("doesActivityMatchRule", () => {
  // Default mock activity that will be modified for different test cases
  const createMockActivity = (overrides = {}): Activity => ({
    timestamp: 1618500000000,
    duration: 300, // 5 minutes
    title: "Test Activity",
    ownerName: "TestApp",
    url: "https://example.com/page",
    activityId: 0,
    platform: "",
    ownerPath: "",
    ownerProcessId: 0,
    userId: "",
    ...overrides,
  });

  // Default mock rule that will be modified for different test cases
  const createMockRule = (overrides = {}): RuleFormValues => ({
    name: "Test Rule",
    description: "",
    rating: 0,
    active: true,
    appName: "TestApp",
    ...overrides,
  });

  describe("App name matching", () => {
    test("should match when app name matches exactly", () => {
      const activity = createMockActivity();
      const rule = createMockRule({ appName: "TestApp" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should not match when app name is different", () => {
      const activity = createMockActivity();
      const rule = createMockRule({ appName: "DifferentApp" });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });
  });

  describe("Domain matching", () => {
    test("should match when domain matches exactly", () => {
      const activity = createMockActivity({ url: "https://example.com/page" });
      const rule = createMockRule({ domain: "example.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when URL contains domain with path", () => {
      const activity = createMockActivity({ url: "https://youtube.com/watch?v=abc123" });
      const rule = createMockRule({ domain: "youtube.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when URL contains domain with subdomain", () => {
      const activity = createMockActivity({ url: "https://www.youtube.com/watch?v=abc123" });
      const rule = createMockRule({ domain: "youtube.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when URL contains domain with complex path", () => {
      const activity = createMockActivity({
        url: "https://facebook.com/profile/user123?tab=posts",
      });
      const rule = createMockRule({ domain: "facebook.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match subdomains correctly", () => {
      const activity = createMockActivity({ url: "https://mail.google.com/mail/u/0/#inbox" });
      const rule = createMockRule({ domain: "google.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should not match when domain is different", () => {
      const activity = createMockActivity({ url: "https://example.com/page" });
      const rule = createMockRule({ domain: "different.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });

    test("should not match partial domain names", () => {
      const activity = createMockActivity({ url: "https://myexample.com/page" });
      const rule = createMockRule({ domain: "example.com" });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });

    test("should match when domain is empty in the rule", () => {
      const activity = createMockActivity({ url: "https://example.com/page" });
      const rule = createMockRule({ domain: "" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });
  });

  describe("Title matching", () => {
    test("should match when title contains specified text", () => {
      const activity = createMockActivity({ title: "This is a Test Activity" });
      const rule = createMockRule({ title: "Test", titleCondition: "contains" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when title equals specified text", () => {
      const activity = createMockActivity({ title: "Test Activity" });
      const rule = createMockRule({ title: "Test Activity", titleCondition: "equals" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when title starts with specified text", () => {
      const activity = createMockActivity({ title: "Test Activity Title" });
      const rule = createMockRule({ title: "Test", titleCondition: "startsWith" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when title ends with specified text", () => {
      const activity = createMockActivity({ title: "This is a Test" });
      const rule = createMockRule({ title: "Test", titleCondition: "endsWith" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should not match when title doesn't match the condition", () => {
      const activity = createMockActivity({ title: "Different Activity" });
      const rule = createMockRule({ title: "Test", titleCondition: "contains" });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });

    test("should match when title is empty in the rule", () => {
      const activity = createMockActivity({ title: "Any Activity" });
      const rule = createMockRule({ title: "", titleCondition: "contains" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });
  });

  describe("Duration matching", () => {
    test("should match when duration is greater than specified value", () => {
      const activity = createMockActivity({ duration: 500 });
      const rule = createMockRule({ duration: 300, durationCondition: ">" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when duration is less than specified value", () => {
      const activity = createMockActivity({ duration: 200 });
      const rule = createMockRule({ duration: 300, durationCondition: "<" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should match when duration equals specified value", () => {
      const activity = createMockActivity({ duration: 300 });
      const rule = createMockRule({ duration: 300, durationCondition: "=" });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should not match when duration doesn't satisfy the condition", () => {
      const activity = createMockActivity({ duration: 200 });
      const rule = createMockRule({ duration: 300, durationCondition: ">" });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });

    test("should match when duration is not specified in the rule", () => {
      const activity = createMockActivity({ duration: 300 });
      const rule = createMockRule({ duration: 0 });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });
  });

  describe("Combined conditions", () => {
    test("should match when all conditions are met", () => {
      const activity = createMockActivity({
        ownerName: "Chrome",
        url: "https://facebook.com/feed",
        title: "Facebook - News Feed",
        duration: 600,
      });

      const rule = createMockRule({
        appName: "Chrome",
        domain: "facebook.com",
        title: "News",
        titleCondition: "contains",
        duration: 500,
        durationCondition: ">",
      });

      expect(doesActivityMatchRule(activity, rule)).toBe(true);
    });

    test("should not match when any condition is not met", () => {
      const activity = createMockActivity({
        ownerName: "Chrome",
        url: "https://facebook.com/feed",
        title: "Facebook - News Feed",
        duration: 400,
      });

      const rule = createMockRule({
        appName: "Chrome",
        domain: "facebook.com",
        title: "News",
        titleCondition: "contains",
        duration: 500,
        durationCondition: ">",
      });

      expect(doesActivityMatchRule(activity, rule)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle null or undefined values", () => {
      const activity = createMockActivity();

      // Null and undefined in rule values
      const ruleWithNulls = createMockRule({
        titleCondition: null,
        durationCondition: null,
      });

      expect(doesActivityMatchRule(activity, ruleWithNulls)).toBe(true);
    });

    test("should handle empty strings", () => {
      const activity = createMockActivity();

      const ruleWithEmptyValues = createMockRule({
        title: "",
        domain: "",
        titleCondition: "",
        durationCondition: "",
      });

      expect(doesActivityMatchRule(activity, ruleWithEmptyValues)).toBe(true);
    });
  });
});

describe("findActivitiesMatchingRule", () => {
  test("should return activities that match the given rule", () => {
    const activities = [
      {
        timestamp: 1618500000000,
        duration: 300,
        title: "Work Document",
        ownerName: "Word",
        url: "",
      },
      {
        timestamp: 1618500100000,
        duration: 600,
        title: "Facebook News",
        ownerName: "Chrome",
        url: "https://facebook.com/news",
      },
      {
        timestamp: 1618500200000,
        duration: 200,
        title: "Work Email",
        ownerName: "Outlook",
        url: "",
      },
    ] as Activity[];

    const rule = {
      name: "Facebook Rule",
      description: "",
      rating: 0,
      active: true,
      appName: "Chrome",
      domain: "facebook.com",
      title: "News",
      titleCondition: "contains",
    } as RuleFormValues;

    const result = findActivitiesMatchingRule(activities, rule);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("Facebook News");
  });
});

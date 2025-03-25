import { Activity } from "@/types/activity";
import { RuleFormValues } from "@/components/rules/rule-dialog";
import { doesActivityMatchRule, findActivitiesMatchingRule } from "./activityUtils";
import { extractDomain } from "./url";

describe("extractDomain", () => {
  it("should extract domain from valid URLs", () => {
    expect(extractDomain("https://www.example.com/page")).toBe("www.example.com");
    expect(extractDomain("http://subdomain.example.org/path?query=1")).toBe(
      "subdomain.example.org"
    );
    expect(extractDomain("https://example.net")).toBe("example.net");
  });

  it("should return the input if URL is invalid", () => {
    expect(extractDomain("invalid-url")).toBe("invalid-url");
  });
});

describe("doesActivityMatchRule", () => {
  const now = new Date();
  const mockActivity: Activity = {
    timestamp: 1,
    ownerName: "Chrome",
    title: "GitHub - Project Page",
    url: "https://github.com/myproject",
    duration: 600,
    userId: "user123",
    activityId: 1,
    platform: "windows",
    ownerPath: "C:\\Program Files\\Google\\Chrome\\chrome.exe",
    ownerProcessId: 1234,
  };

  it("should match app name rule", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "app_name",
      value: "Chrome",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "Firefox",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match domain rule", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "domain",
      value: "github.com",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "gitlab.com",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match URL with contains condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "url",
      value: "github",
      condition: "contains",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "gitlab",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match URL with equals condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "url",
      value: "https://github.com/myproject",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "https://github.com/otherproject",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match title with contains condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "title",
      value: "Project",
      condition: "contains",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "Issues",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match title with equals condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "title",
      value: "GitHub - Project Page",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "GitHub - Settings",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should handle activities without URL for URL and domain rules", () => {
    const activityWithoutUrl: Activity = {
      ...mockActivity,
      url: undefined,
    };

    const urlRule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "url",
      value: "github",
      condition: "contains",
      rating: 0,
      active: true,
      description: "",
    };

    const domainRule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "domain",
      value: "github.com",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(activityWithoutUrl, urlRule)).toBe(false);
    expect(doesActivityMatchRule(activityWithoutUrl, domainRule)).toBe(false);
  });

  // Additional tests for URL conditions
  it("should match URL with startsWith condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "url",
      value: "https://github",
      condition: "startsWith",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "http://gitlab",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match URL with endsWith condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "url",
      value: "myproject",
      condition: "endsWith",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "otherproject",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  // Additional tests for title conditions
  it("should match title with startsWith condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "title",
      value: "GitHub",
      condition: "startsWith",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "GitLab",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match title with endsWith condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "title",
      value: "Project Page",
      condition: "endsWith",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "Settings Page",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  // Tests for duration rule type
  it("should match duration with equals condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "600",
      condition: "=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "500",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match duration with greater than condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "500",
      condition: ">",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "700",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match duration with less than condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "700",
      condition: "<",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "500",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match duration with greater than or equal condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "600",
      condition: ">=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const rule2: RuleFormValues = {
      ...rule,
      value: "500",
    };
    expect(doesActivityMatchRule(mockActivity, rule2)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "700",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should match duration with less than or equal condition", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "600",
      condition: "<=",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(true);

    const rule2: RuleFormValues = {
      ...rule,
      value: "700",
    };
    expect(doesActivityMatchRule(mockActivity, rule2)).toBe(true);

    const nonMatchingRule: RuleFormValues = {
      ...rule,
      value: "500",
    };
    expect(doesActivityMatchRule(mockActivity, nonMatchingRule)).toBe(false);
  });

  it("should handle invalid duration values", () => {
    const rule: RuleFormValues = {
      name: "Test Rule",
      ruleType: "duration",
      value: "not-a-number",
      condition: ">",
      rating: 0,
      active: true,
      description: "",
    };

    expect(doesActivityMatchRule(mockActivity, rule)).toBe(false);
  });
});

const mockActivities: Activity[] = [
  {
    timestamp: 1,
    ownerName: "Chrome",
    title: "GitHub - Project Page",
    url: "https://github.com/myproject",
    duration: 600,
    userId: "user123",
    ownerProcessId: 1,
    activityId: 1,
    platform: "windows",
    ownerPath: "C:\\Program Files\\Google\\Chrome\\chrome.exe",
  },
  {
    timestamp: 2,
    ownerName: "VS Code",
    title: "index.ts - Project",
    url: undefined,
    duration: 1200,
    userId: "user123",
    ownerProcessId: 1234,
    activityId: 2,
    platform: "windows",
    ownerPath: "C:\\Program Files\\Microsoft VS Code\\Code.exe",
  },
  {
    timestamp: 3,
    ownerName: "Chrome",
    title: "Google Search",
    url: "https://google.com",
    duration: 300,
    userId: "user123",

    activityId: 3,
    platform: "windows",
    ownerPath: "C:\\Program Files\\Google\\Chrome\\chrome.exe",
    ownerProcessId: 1234,
  },
];

it("should find all activities matching app name rule", () => {
  const rule: RuleFormValues = {
    name: "Chrome Rule",
    ruleType: "app_name",
    value: "Chrome",
    condition: "=",
    rating: 0,
    active: true,
    description: "",
  };

  const result = findActivitiesMatchingRule(mockActivities, rule);
  expect(result).toHaveLength(2);
  expect(result[0].timestamp).toBe(1);
  expect(result[1].timestamp).toBe(3);
});

it("should find all activities matching domain rule", () => {
  const rule: RuleFormValues = {
    name: "GitHub Rule",
    ruleType: "domain",
    value: "github.com",
    condition: "=",
    rating: 0,
    active: true,
    description: "",
  };

  const result = findActivitiesMatchingRule(mockActivities, rule);
  expect(result).toHaveLength(1);
  expect(result[0].timestamp).toBe(1);
});

it("should find all activities matching url contains rule", () => {
  const rule: RuleFormValues = {
    name: "GitHub Rule",
    ruleType: "url",
    value: "github",
    condition: "contains",
    rating: 0,
    active: true,
    description: "",
  };

  const result = findActivitiesMatchingRule(mockActivities, rule);
  expect(result).toHaveLength(1);
  expect(result[0].timestamp).toBe(1);
});

it("should find all activities matching title contains rule", () => {
  const rule: RuleFormValues = {
    name: "Project Rule",
    ruleType: "title",
    value: "Project",
    condition: "contains",
    rating: 0,
    active: true,
    description: "",
  };

  const result = findActivitiesMatchingRule(mockActivities, rule);
  expect(result).toHaveLength(2);
  expect(result[0].timestamp).toBe(1);
  expect(result[1].timestamp).toBe(2);
});

it("should return empty array when no activities match", () => {
  const rule: RuleFormValues = {
    name: "No Match Rule",
    ruleType: "app_name",
    value: "Firefox",
    condition: "=",
    rating: 0,
    active: true,
    description: "",
  };

  const result = findActivitiesMatchingRule(mockActivities, rule);
  expect(result).toHaveLength(0);
});

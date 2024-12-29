import { ActivityRecord, CategoryRule, CategoryDurationReport } from "../types/activity";

const defaultCategories: CategoryRule[] = [
  {
    category: ["Work", "Programming", "ActivityWatch"],
    matches: {
      application: "vim",
      title: /activitywatch|aw-server/i,
    },
  },
  {
    category: ["Work", "Programming"],
    matches: {
      domain: "github.com",
    },
  },
  {
    category: ["Comms", "Video Conferencing"],
    matches: {
      application: "zoom",
    },
  },
  {
    category: ["Comms", "Email"],
    matches: {
      domain: "mail.google.com",
    },
  },
  {
    category: ["Media", "Games"],
    matches: {
      application: "Minecraft",
    },
  },
  {
    category: ["Media", "Social Media"],
    matches: {
      domain: "reddit.com",
    },
  },
  {
    category: ["Media", "Video"],
    matches: {
      domain: "youtube.com",
    },
  },
  {
    category: ["Media", "Music"],
    matches: {
      application: "Spotify",
    },
  },
];

export class CategoryMapper {
  private rules: CategoryRule[];

  constructor(customRules: CategoryRule[] = []) {
    this.rules = [...defaultCategories, ...customRules];
  }

  categorizeActivity(activity: ActivityRecord): string[] {
    for (const rule of this.rules) {
      if (this.matchesRule(activity, rule)) {
        return rule.category;
      }
    }
    return ["Uncategorized"];
  }

  private matchesRule(activity: ActivityRecord, rule: CategoryRule): boolean {
    const { matches } = rule;

    if (
      matches.application &&
      activity.ownerName.toLowerCase().includes(matches.application.toLowerCase())
    ) {
      return true;
    }

    if (matches.title && matches.title.test(activity.title)) {
      return true;
    }

    if (matches.domain && activity.url?.includes(matches.domain)) {
      return true;
    }

    return false;
  }

  buildCategoryTree(activities: ActivityRecord[]): CategoryDurationReport[] {
    const categoryMap = new Map<string, CategoryDurationReport>();

    activities.forEach((activity) => {
      const categories = this.categorizeActivity(activity);
      this.addToTree(categoryMap, categories, activity);
    });

    return this.mapToTree(categoryMap);
  }

  private addToTree(
    categoryMap: Map<string, CategoryDurationReport>,
    categories: string[],
    activity: ActivityRecord
  ) {
    let currentPath = "";

    categories.forEach((category, index) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${category}` : category;

      if (!categoryMap.has(currentPath)) {
        categoryMap.set(currentPath, {
          category: categories.slice(0, index + 1),
          totalDuration: 0,
          percentage: 0,
          children: [],
          instances: [],
        });
      }

      const node = categoryMap.get(currentPath)!;
      // Here you would calculate the actual duration based on your activity data
      // This is a simplified example
      node.instances.push({
        startTime: activity.timestamp,
        endTime: activity.timestamp + 1000, // Example duration
        duration: 1000,
      });
      node.totalDuration += 1000;

      if (parentPath) {
        const parentNode = categoryMap.get(parentPath)!;
        if (!parentNode.children.includes(node)) {
          parentNode.children.push(node);
        }
      }
    });
  }

  private mapToTree(categoryMap: Map<string, CategoryDurationReport>): CategoryDurationReport[] {
    const rootNodes = Array.from(categoryMap.values()).filter((node) => node.category.length === 1);

    // Calculate percentages
    const totalDuration = rootNodes.reduce((sum, node) => sum + node.totalDuration, 0);
    this.calculatePercentages(rootNodes, totalDuration);

    return rootNodes;
  }

  private calculatePercentages(nodes: CategoryDurationReport[], totalDuration: number) {
    nodes.forEach((node) => {
      node.percentage = (node.totalDuration / totalDuration) * 100;
      if (node.children.length > 0) {
        this.calculatePercentages(node.children, node.totalDuration);
      }
    });
  }
}

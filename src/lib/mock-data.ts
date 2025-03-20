import type { Session, Rule } from "@/lib/types"

export const mockSessions: Session[] = [
  {
    id: "session-1",
    date: "2025-03-19T10:00:00Z",
    duration: 7200, // 2 hours
    activities: [
      {
        id: "activity-1",
        appName: "VS Code",
        domainName: null,
        title: "Project Development",
        duration: 3600, // 1 hour
        isClassified: true,
        isProductive: true,
      },
      {
        id: "activity-2",
        appName: "Chrome",
        domainName: "github.com",
        title: "GitHub Repository",
        duration: 1800, // 30 minutes
        isClassified: true,
        isProductive: true,
      },
      {
        id: "activity-3",
        appName: "Chrome",
        domainName: "youtube.com",
        title: "YouTube Videos",
        duration: 1200, // 20 minutes
        isClassified: false,
        isProductive: false,
      },
      {
        id: "activity-4",
        appName: "Slack",
        domainName: null,
        title: "Team Communication",
        duration: 600, // 10 minutes
        isClassified: true,
        isProductive: true,
      },
    ],
  },
  {
    id: "session-2",
    date: "2025-03-18T14:00:00Z",
    duration: 5400, // 1.5 hours
    activities: [
      {
        id: "activity-5",
        appName: "Chrome",
        domainName: "docs.google.com",
        title: "Google Docs",
        duration: 2700, // 45 minutes
        isClassified: true,
        isProductive: true,
      },
      {
        id: "activity-6",
        appName: "Chrome",
        domainName: "twitter.com",
        title: "Twitter Feed",
        duration: 1800, // 30 minutes
        isClassified: false,
        isProductive: false,
      },
      {
        id: "activity-7",
        appName: "Spotify",
        domainName: null,
        title: "Music Streaming",
        duration: 900, // 15 minutes
        isClassified: false,
        isProductive: false,
      },
    ],
  },
  {
    id: "session-3",
    date: "2025-03-17T09:00:00Z",
    duration: 10800, // 3 hours
    activities: [
      {
        id: "activity-8",
        appName: "Figma",
        domainName: null,
        title: "Design Work",
        duration: 5400, // 1.5 hours
        isClassified: true,
        isProductive: true,
      },
      {
        id: "activity-9",
        appName: "Chrome",
        domainName: "notion.so",
        title: "Notion Workspace",
        duration: 3600, // 1 hour
        isClassified: true,
        isProductive: true,
      },
      {
        id: "activity-10",
        appName: "Chrome",
        domainName: "instagram.com",
        title: "Instagram",
        duration: 1800, // 30 minutes
        isClassified: false,
        isProductive: false,
      },
    ],
  },
]

export const mockRules: Rule[] = [
  {
    id: "rule-1",
    type: "app",
    name: "VS Code",
    isProductive: true,
    createdAt: "2025-03-15T10:00:00Z",
  },
  {
    id: "rule-2",
    type: "domain",
    name: "github.com",
    isProductive: true,
    createdAt: "2025-03-15T10:05:00Z",
  },
  {
    id: "rule-3",
    type: "app",
    name: "Slack",
    isProductive: true,
    createdAt: "2025-03-16T14:30:00Z",
  },
  {
    id: "rule-4",
    type: "domain",
    name: "notion.so",
    isProductive: true,
    createdAt: "2025-03-17T09:45:00Z",
  },
]


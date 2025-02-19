import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable(
  "activities",
  {
    timestamp: integer("timestamp").primaryKey(),
    activityId: integer("activity_id").notNull(),
    platform: text("platform").notNull(),
    title: text("title").notNull(),
    ownerPath: text("owner_path").notNull(),
    ownerProcessId: integer("owner_process_id").notNull(),
    ownerBundleId: text("owner_bundle_id"),
    ownerName: text("owner_name").notNull(),
    url: text("url"),
    duration: integer().notNull().default(0),
    taskId: text("task_id"),
    isFocused: integer("is_focused", { mode: "boolean" }).default(false),
    userId: text("user_id").notNull(),
  },
  (table) => [
    index("isFocused_idx").on(table.isFocused),
    index("userId_idx").on(table.userId),
    index("taskId_idx").on(table.taskId),
  ]
);

export const blockedDomains = sqliteTable(
  "blocked_domains",
  {
    userId: text("user_id").notNull(),
    domain: text("domain").primaryKey(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("blocked_domains_user_idx").on(table.userId)]
);

export const blockedApps = sqliteTable(
  "blocked_apps",
  {
    userId: text("user_id").notNull(),
    appName: text("app_name").primaryKey(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("blocked_apps_user_idx").on(table.userId)]
);

export const localStorage = sqliteTable(
  "local_storage",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at").notNull(),
  }
);

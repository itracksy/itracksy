import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable(
  "activities",
  {
    timestamp: integer().notNull(),
    activityId: integer("activity_id").notNull(),
    platform: text("platform").notNull(),
    title: text("title").notNull(),
    ownerPath: text("owner_path").notNull(),
    ownerProcessId: integer("owner_process_id").notNull(),
    ownerBundleId: text("owner_bundle_id"),
    ownerName: text("owner_name").notNull(),
    url: text("url"),
    duration: integer().notNull(),
    taskId: text("task_id"),
    isFocused: integer("is_focused", { mode: "boolean" }).default(false).notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.timestamp] }),
    index("isFocused_idx").on(table.isFocused),
    index("userId_idx").on(table.userId),
    index("taskId_idx").on(table.taskId),
    index("activity_match_idx").on(
      table.title,
      table.ownerBundleId,
      table.ownerName,
      table.ownerPath,
      table.platform,
      table.taskId,
      table.isFocused
    ),
  ]
);

export const blockedDomains = sqliteTable(
  "blocked_domains",
  {
    userId: text("user_id").notNull(),
    domain: text("domain").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.domain] }),
    index("blocked_domains_user_idx").on(table.userId),
    index("blocked_domains_domain_idx").on(table.domain),
  ]
);

export const blockedApps = sqliteTable(
  "blocked_apps",
  {
    userId: text("user_id").notNull(),
    appName: text("app_name").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.appName] }),
    index("blocked_apps_user_idx").on(table.userId),
    index("blocked_apps_name_idx").on(table.appName),
  ]
);

export const localStorage = sqliteTable("local_storage", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

import { relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
  real,
  unique,
} from "drizzle-orm/sqlite-core";
import { title } from "process";

// Tables
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: integer("created_at"),
  deletedAt: integer("deleted_at"), // Field to track when a board was archived
  currency: text("currency"),
  hourlyRate: real("hourly_rate"),
  userId: text("user_id").notNull(),
});

export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id),
  order: integer("order").notNull(),
  createdAt: integer("created_at"),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id),
  columnId: text("column_id")
    .notNull()
    .references(() => columns.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  createdAt: integer("created_at"),
});

export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time"),
  duration: integer("duration"), // seconds
  targetDuration: integer("target_duration"), // Duration in minutes
  description: text("description"),
  isFocusMode: integer("is_focus_mode", { mode: "boolean" }), // we have focus / break mode
  autoStopEnabled: integer("auto_stop_enabled", { mode: "boolean" }).default(true),
  boardId: text("board_id").references(() => boards.id),
  itemId: text("item_id").references(() => items.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  invoiceId: text("invoice_id"),
  createdAt: integer("created_at"),
  whiteListedActivities: text("white_listed_activities"),
  notificationSentAt: integer("notification_sent_at"),
});

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
    ownerName: text("owner_name").notNull(), // app name
    url: text("url"),
    duration: integer().notNull(), // seconds
    timeEntryId: text("timeEntryId"),
    userId: text("user_id").notNull(),
    isFocusMode: integer("is_focus_mode", { mode: "boolean" }),
    rating: integer("rating"), // null = unrated, 0 = bad, 1 = good
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    activityRuleId: text("activity_rule_id").references(() => activityRules.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.timestamp] }),
    index("userId_idx").on(table.userId),
    index("isFocusMode_idx").on(table.isFocusMode),
    index("timeEntryId_idx").on(table.timeEntryId),
    index("activity_rating_idx").on(table.rating),
    index("activity_match_idx").on(
      table.title,
      table.ownerBundleId,
      table.ownerName,
      table.ownerPath,
      table.platform,
      table.timeEntryId
    ),
  ]
);

export const activityRules = sqliteTable(
  "activity_rules",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    appName: text("app_name").notNull(), // Optional app name
    domain: text("domain").default("").notNull(), // Optional domain

    titleCondition: text("condition").default(""), // '>', '<', '=', 'contains', etc.
    title: text("title").default(""), // The title of the activity

    duration: integer("duration").default(0), // Duration in seconds
    durationCondition: text("duration_condition"), // '>', '<', '=', 'contains', etc.
    rating: integer("rating").notNull(), // 0 = bad, 1 = good
    userId: text("user_id").notNull(),
    createdAt: integer("created_at").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    index("activity_rules_user_id_idx").on(table.userId),

    index("activity_rules_active_idx").on(table.active),
    index("activity_rules_rating_idx").on(table.rating),
    // Add a unique composite key to ensure no duplicate rules
    unique().on(table.userId, table.title, table.appName, table.domain),
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

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: text("type").notNull(), // 'system', 'time_entry', etc.
    userId: text("user_id").notNull(),
    timeEntryId: text("time_entry_id").references(() => timeEntries.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_type_idx").on(table.type),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_time_entry_id_idx").on(table.timeEntryId),
  ]
);

export const focusTargets = sqliteTable(
  "focus_targets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    targetMinutes: integer("target_minutes").notNull(), // Daily focus target in minutes
    enableReminders: integer("enable_reminders", { mode: "boolean" }).notNull().default(true),
    reminderIntervalMinutes: integer("reminder_interval_minutes").notNull().default(60), // Reminder frequency
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("focus_targets_user_id_idx").on(table.userId),
    unique().on(table.userId), // Only one target per user
  ]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"), // Hex color for UI representation
    icon: text("icon"), // Icon name or emoji
    parentId: text("parent_id"),
    path: text("path").notNull(), // Full path like "/Work/Development/Frontend"
    level: integer("level").notNull().default(0), // Depth level (0 = root)
    order: integer("order").notNull().default(0), // Sort order within parent
    userId: text("user_id").notNull(), // User-specific categories
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false), // System vs user categories
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_path_idx").on(table.path),
    index("categories_level_idx").on(table.level),
    index("categories_system_idx").on(table.isSystem),
    unique().on(table.userId, table.name, table.parentId), // Unique name per parent per user
  ]
);

export const categoryMappings = sqliteTable(
  "category_mappings",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    appName: text("app_name"), // App name pattern (can use wildcards)
    domain: text("domain"), // Domain pattern (can use wildcards)
    titlePattern: text("title_pattern"), // Optional title pattern matching
    matchType: text("match_type").notNull().default("exact"), // "exact", "contains", "starts_with", "regex"
    priority: integer("priority").notNull().default(0), // Higher priority = matched first
    userId: text("user_id").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("category_mappings_category_id_idx").on(table.categoryId),
    index("category_mappings_user_id_idx").on(table.userId),
    index("category_mappings_app_name_idx").on(table.appName),
    index("category_mappings_domain_idx").on(table.domain),
    index("category_mappings_priority_idx").on(table.priority),
    index("category_mappings_active_idx").on(table.isActive),
    // Composite index for matching
    index("category_mappings_match_idx").on(table.appName, table.domain, table.isActive),
  ]
);

export const scheduledSessions = sqliteTable(
  "scheduled_sessions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    focusDuration: integer("focus_duration").notNull(), // minutes
    breakDuration: integer("break_duration").notNull(), // minutes
    cycles: integer("cycles").notNull().default(1),
    startTime: text("start_time").notNull(), // HH:MM format
    daysOfWeek: text("days_of_week").notNull(), // JSON array of numbers [0-6]
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    autoStart: integer("auto_start", { mode: "boolean" }).notNull().default(false),
    userId: text("user_id").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    lastRun: integer("last_run"), // Timestamp of last execution
    nextRun: integer("next_run"), // Calculated next execution time
  },
  (table) => [
    index("scheduled_sessions_user_id_idx").on(table.userId),
    index("scheduled_sessions_active_idx").on(table.isActive),
    index("scheduled_sessions_next_run_idx").on(table.nextRun),
    index("scheduled_sessions_auto_start_idx").on(table.autoStart),
  ]
);

// Relations
export const boardsRelations = relations(boards, ({ many }) => ({
  columns: many(columns),
  items: many(items),
  timeEntries: many(timeEntries),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  board: one(boards, {
    fields: [items.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [items.columnId],
    references: [columns.id],
  }),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  board: one(boards, {
    fields: [timeEntries.boardId],
    references: [boards.id],
  }),
  item: one(items, {
    fields: [timeEntries.itemId],
    references: [items.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  timeEntry: one(timeEntries, {
    fields: [notifications.timeEntryId],
    references: [timeEntries.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  timeEntry: one(timeEntries, {
    fields: [activities.timeEntryId],
    references: [timeEntries.id],
  }),
  activityRule: one(activityRules, {
    fields: [activities.activityRuleId],
    references: [activityRules.id],
  }),
  category: one(categories, {
    fields: [activities.categoryId],
    references: [categories.id],
  }),
}));

export const activityRulesRelations = relations(activityRules, ({ many }) => ({
  activities: many(activities),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild",
  }),
  children: many(categories, {
    relationName: "parentChild",
  }),
  activities: many(activities),
  mappings: many(categoryMappings),
}));

export const categoryMappingsRelations = relations(categoryMappings, ({ one }) => ({
  category: one(categories, {
    fields: [categoryMappings.categoryId],
    references: [categories.id],
  }),
}));

export const scheduledSessionsRelations = relations(scheduledSessions, ({ one }) => ({
  // Could add relation to user table if implemented
}));

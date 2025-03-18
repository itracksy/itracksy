import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index, primaryKey, real } from "drizzle-orm/sqlite-core";

// Tables
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: integer("created_at"),
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
    .references(() => columns.id),
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
  itemId: text("item_id").references(() => items.id),
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
  },
  (table) => [
    primaryKey({ columns: [table.timestamp] }),
    index("userId_idx").on(table.userId),
    index("isFocusMode_idx").on(table.isFocusMode),
    index("timeEntryId_idx").on(table.timeEntryId),
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
    ruleType: text("rule_type").notNull(), // 'duration', 'app_name', 'domain', etc.
    condition: text("condition").notNull(), // '>', '<', '=', 'contains', etc.
    value: text("value").notNull(), // The value to compare against
    rating: integer("rating").notNull(), // 0 = bad, 1 = good
    userId: text("user_id").notNull(),
    createdAt: integer("created_at").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    index("activity_rules_user_id_idx").on(table.userId),
    index("activity_rules_rule_type_idx").on(table.ruleType),
    index("activity_rules_active_idx").on(table.active),
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
    timeEntryId: text("time_entry_id").references(() => timeEntries.id),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_type_idx").on(table.type),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_time_entry_id_idx").on(table.timeEntryId),
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
}));

export const activityRulesRelations = relations(activityRules, ({ many }) => ({
  // No direct relations needed for now, but could be extended in the future
}));

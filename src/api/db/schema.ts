import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index, primaryKey, real } from "drizzle-orm/sqlite-core";

// Tables
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: text("created_at"),
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
  createdAt: text("created_at"),
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
  createdAt: text("created_at"),
});

export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  duration: integer("duration"),
  description: text("description"),
  isFocusMode: integer("is_focus_mode", { mode: "boolean" }),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  userId: text("user_id").notNull(),
  invoiceId: text("invoice_id"),
  createdAt: text("created_at"),
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

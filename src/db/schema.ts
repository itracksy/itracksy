import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable("activities", {
  activityId: integer("activity_id").notNull(),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  ownerPath: text("owner_path").notNull(),
  ownerProcessId: integer("owner_process_id").notNull(),
  ownerBundleId: text("owner_bundle_id"),
  ownerName: text("owner_name").notNull(),
  url: text("url"),
  timestamp: integer("timestamp").notNull(),
  count: integer("count").notNull().default(1),
  taskId: text("task_id"),
  isFocused: integer("is_focused", { mode: "boolean" }).default(false),
  userId: text("user_id"),
});

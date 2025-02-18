import { sqliteTable, AnySQLiteColumn, text, integer } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable("activities", {
  platform: text().notNull(),
  id: integer().notNull(),
  title: text().notNull(),
  ownerPath: text("owner_path").notNull(),
  ownerProcessId: integer("owner_process_id").notNull(),
  ownerBundleId: text("owner_bundle_id"),
  ownerName: text("owner_name").notNull().notNull(),
  url: text(),
  timestamp: integer().notNull(),
  count: integer().notNull(),
  userId: text("user_id"),
});

export const tasks = sqliteTable("tasks", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  description: text(),
  status: text().default("pending"),
  createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`"),
  updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(), // 'id' is the column name
  fullName: text("full_name"),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(), // 'id' is the column name
  name: text("name"),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
});

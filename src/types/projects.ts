import { activities, boards, columns, items, timeEntries } from "../api/db/schema";

// Base table types
export type Board = typeof boards.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Item = typeof items.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Activity = typeof activities.$inferSelect;

// Insert types
export type BoardInsert = typeof boards.$inferInsert;
export type ColumnInsert = typeof columns.$inferInsert;
export type ItemInsert = typeof items.$inferInsert;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
export type ActivityInsert = typeof activities.$inferInsert;

// Extended types for nested relationships
export type BoardWithRelations = Board & {
  columns: Column[];
  items: Item[];
};

export type TimeEntryWithRelations = TimeEntry & {
  item: Item | null;
};

// Table update types
export type BoardUpdate = Partial<BoardInsert>;
export type ColumnUpdate = Partial<ColumnInsert>;
export type ItemUpdate = Partial<ItemInsert>;
export type TimeEntryUpdate = Partial<TimeEntryInsert>;
export type ActivityUpdate = Partial<ActivityInsert>;

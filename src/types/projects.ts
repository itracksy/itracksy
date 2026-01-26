import { activities, boards, columns, items, timeEntries } from "../api/db/schema";

// Base table types
export type Board = typeof boards.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Item = typeof items.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
type Activity = typeof activities.$inferSelect;

// Insert types
type BoardInsert = typeof boards.$inferInsert;
export type ColumnInsert = typeof columns.$inferInsert;
export type ItemInsert = typeof items.$inferInsert;
type TimeEntryInsert = typeof timeEntries.$inferInsert;
type ActivityInsert = typeof activities.$inferInsert;

// Subtask type
export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

// Extended types for nested relationships
export type BoardWithRelations = Board & {
  columns: Column[];
  items: Item[];
};

export type TimeEntryWithRelations = TimeEntry & {
  item: Item | null;
};

// Item with parsed subtasks
type ItemWithSubtasks = Item & {
  parsedSubtasks: Subtask[];
};

// Table update types
type BoardUpdate = Partial<BoardInsert>;
type ColumnUpdate = Partial<ColumnInsert>;
type ItemUpdate = Partial<ItemInsert>;
type TimeEntryUpdate = Partial<TimeEntryInsert>;
type ActivityUpdate = Partial<ActivityInsert>;

import { notifications } from "@/api/db/schema";

export type NotificationInsert = typeof notifications.$inferInsert & {
  type: "system" | "engagement_time_entry" | "remind_last_time_entry";
};

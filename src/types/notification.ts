import { notifications } from "@/api/db/schema";

export type NotificationInsert = typeof notifications.$inferInsert & {
  type:
    | "blocking_notification"
    | "engagement_time_entry"
    | "remind_last_time_entry"
    | "focus_reminder"
    | "target_completed"
    | "daily_start";
};

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activities` (
	`activity_id` integer NOT NULL,
	`platform` text NOT NULL,
	`title` text NOT NULL,
	`owner_path` text NOT NULL,
	`owner_process_id` integer NOT NULL,
	`owner_bundle_id` text,
	`owner_name` text NOT NULL,
	`url` text,
	`timestamp` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`task_id` text,
	`is_focused` integer DEFAULT false,
	`user_id` text
);
--> statement-breakpoint
INSERT INTO `__new_activities`("activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "timestamp", "count", "task_id", "is_focused", "user_id") SELECT "activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "timestamp", "count", "task_id", "is_focused", "user_id" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
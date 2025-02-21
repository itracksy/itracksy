PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activities` (
	`timestamp` integer PRIMARY KEY NOT NULL,
	`activity_id` integer NOT NULL,
	`platform` text NOT NULL,
	`title` text NOT NULL,
	`owner_path` text NOT NULL,
	`owner_process_id` integer NOT NULL,
	`owner_bundle_id` text,
	`owner_name` text NOT NULL,
	`url` text,
	`duration` integer NOT NULL,
	`task_id` text,
	`is_focused` integer DEFAULT false,
	`user_id` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_activities`("timestamp", "activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "duration", "task_id", "is_focused", "user_id") SELECT "timestamp", "activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "duration", "task_id", "is_focused", "user_id" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `isFocused_idx` ON `activities` (`is_focused`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `taskId_idx` ON `activities` (`task_id`);--> statement-breakpoint
CREATE INDEX `activity_match_idx` ON `activities` (`title`,`owner_bundle_id`,`owner_name`,`owner_path`,`platform`,`task_id`,`is_focused`);
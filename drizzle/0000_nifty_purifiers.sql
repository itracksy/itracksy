CREATE TABLE `activities` (
	`timestamp` integer PRIMARY KEY NOT NULL,
	`activity_id` integer NOT NULL,
	`platform` text NOT NULL,
	`title` text NOT NULL,
	`owner_path` text NOT NULL,
	`owner_process_id` integer NOT NULL,
	`owner_bundle_id` text,
	`owner_name` text NOT NULL,
	`url` text,
	`duration` integer DEFAULT 0 NOT NULL,
	`task_id` text,
	`is_focused` integer DEFAULT false,
	`user_id` text
);
--> statement-breakpoint
CREATE INDEX `isFocused_idx` ON `activities` (`is_focused`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `taskId_idx` ON `activities` (`task_id`);
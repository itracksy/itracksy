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
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `isFocused_idx` ON `activities` (`is_focused`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `taskId_idx` ON `activities` (`task_id`);--> statement-breakpoint
CREATE TABLE `blocked_apps` (
	`user_id` text NOT NULL,
	`app_name` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `blocked_apps_user_idx` ON `blocked_apps` (`user_id`);--> statement-breakpoint
CREATE TABLE `blocked_domains` (
	`user_id` text NOT NULL,
	`domain` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `blocked_domains_user_idx` ON `blocked_domains` (`user_id`);--> statement-breakpoint
CREATE TABLE `local_storage` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);

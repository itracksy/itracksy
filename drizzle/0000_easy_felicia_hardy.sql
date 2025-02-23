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
	`duration` integer NOT NULL,
	`task_id` text,
	`is_focused` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `isFocused_idx` ON `activities` (`is_focused`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `taskId_idx` ON `activities` (`task_id`);--> statement-breakpoint
CREATE INDEX `activity_match_idx` ON `activities` (`title`,`owner_bundle_id`,`owner_name`,`owner_path`,`platform`,`task_id`,`is_focused`);--> statement-breakpoint
CREATE TABLE `blocked_apps` (
	`user_id` text NOT NULL,
	`app_name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `app_name`)
);
--> statement-breakpoint
CREATE INDEX `blocked_apps_user_idx` ON `blocked_apps` (`user_id`);--> statement-breakpoint
CREATE INDEX `blocked_apps_name_idx` ON `blocked_apps` (`app_name`);--> statement-breakpoint
CREATE TABLE `blocked_domains` (
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `domain`)
);
--> statement-breakpoint
CREATE INDEX `blocked_domains_user_idx` ON `blocked_domains` (`user_id`);--> statement-breakpoint
CREATE INDEX `blocked_domains_domain_idx` ON `blocked_domains` (`domain`);--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text,
	`currency` text,
	`hourly_rate` real,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `columns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`board_id` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`board_id` text NOT NULL,
	`column_id` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `local_storage` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration` integer,
	`description` text,
	`is_focus_mode` integer,
	`board_id` text NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`invoice_id` text,
	`created_at` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);

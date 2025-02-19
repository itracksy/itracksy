CREATE TABLE `blocked_apps` (
	`user_id` text NOT NULL,
	`app_name` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_settings`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `blocked_apps_user_idx` ON `blocked_apps` (`user_id`);--> statement-breakpoint
CREATE TABLE `blocked_domains` (
	`user_id` text NOT NULL,
	`domain` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_settings`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `blocked_domains_user_idx` ON `blocked_domains` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`accessibility_permission` integer DEFAULT false NOT NULL,
	`screen_recording_permission` integer DEFAULT false NOT NULL,
	`is_focus_mode` integer DEFAULT true NOT NULL,
	`current_task_id` text,
	`lastUpdateActivity` integer,
	`updated_at` integer NOT NULL
);

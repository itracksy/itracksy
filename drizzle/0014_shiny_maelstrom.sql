CREATE TABLE `scheduled_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`focus_duration` integer NOT NULL,
	`break_duration` integer NOT NULL,
	`cycles` integer DEFAULT 1 NOT NULL,
	`start_time` text NOT NULL,
	`days_of_week` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`auto_start` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_run` integer,
	`next_run` integer
);
--> statement-breakpoint
CREATE INDEX `scheduled_sessions_user_id_idx` ON `scheduled_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `scheduled_sessions_active_idx` ON `scheduled_sessions` (`is_active`);--> statement-breakpoint
CREATE INDEX `scheduled_sessions_next_run_idx` ON `scheduled_sessions` (`next_run`);--> statement-breakpoint
CREATE INDEX `scheduled_sessions_auto_start_idx` ON `scheduled_sessions` (`auto_start`);
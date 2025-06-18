CREATE TABLE `focus_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_minutes` integer NOT NULL,
	`enable_reminders` integer DEFAULT true NOT NULL,
	`reminder_interval_minutes` integer DEFAULT 60 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `focus_targets_user_id_idx` ON `focus_targets` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `focus_targets_user_id_unique` ON `focus_targets` (`user_id`);
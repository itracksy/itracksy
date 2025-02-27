CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`type` text NOT NULL,
	`user_id` text NOT NULL,
	`time_entry_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`time_entry_id`) REFERENCES `time_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_time_entry_id_idx` ON `notifications` (`time_entry_id`);
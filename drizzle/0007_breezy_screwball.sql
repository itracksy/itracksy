PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`board_id` text NOT NULL,
	`column_id` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_items`("id", "title", "content", "board_id", "column_id", "order", "created_at") SELECT "id", "title", "content", "board_id", "column_id", "order", "created_at" FROM `items`;--> statement-breakpoint
DROP TABLE `items`;--> statement-breakpoint
ALTER TABLE `__new_items` RENAME TO `items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`duration` integer,
	`target_duration` integer,
	`description` text,
	`is_focus_mode` integer,
	`auto_stop_enabled` integer DEFAULT true,
	`board_id` text,
	`item_id` text,
	`user_id` text NOT NULL,
	`invoice_id` text,
	`created_at` integer,
	`white_listed_activities` text,
	`notification_sent_at` integer,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_time_entries`("id", "start_time", "end_time", "duration", "target_duration", "description", "is_focus_mode", "auto_stop_enabled", "board_id", "item_id", "user_id", "invoice_id", "created_at", "white_listed_activities", "notification_sent_at") SELECT "id", "start_time", "end_time", "duration", "target_duration", "description", "is_focus_mode", "auto_stop_enabled", "board_id", "item_id", "user_id", "invoice_id", "created_at", "white_listed_activities", "notification_sent_at" FROM `time_entries`;--> statement-breakpoint
DROP TABLE `time_entries`;--> statement-breakpoint
ALTER TABLE `__new_time_entries` RENAME TO `time_entries`;
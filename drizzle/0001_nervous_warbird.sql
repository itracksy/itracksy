PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration` integer,
	`description` text,
	`is_focus_mode` integer,
	`board_id` text,
	`item_id` text,
	`user_id` text NOT NULL,
	`invoice_id` text,
	`created_at` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_time_entries`("id", "start_time", "end_time", "duration", "description", "is_focus_mode", "board_id", "item_id", "user_id", "invoice_id", "created_at") SELECT "id", "start_time", "end_time", "duration", "description", "is_focus_mode", "board_id", "item_id", "user_id", "invoice_id", "created_at" FROM `time_entries`;--> statement-breakpoint
DROP TABLE `time_entries`;--> statement-breakpoint
ALTER TABLE `__new_time_entries` RENAME TO `time_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
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
	`timeEntryId` text,
	`user_id` text NOT NULL,
	`is_focus_mode` integer,
	`rating` integer,
	`activity_rule_id` text,
	FOREIGN KEY (`activity_rule_id`) REFERENCES `activity_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_activities`("timestamp", "activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "duration", "timeEntryId", "user_id", "is_focus_mode", "rating", "activity_rule_id") SELECT "timestamp", "activity_id", "platform", "title", "owner_path", "owner_process_id", "owner_bundle_id", "owner_name", "url", "duration", "timeEntryId", "user_id", "is_focus_mode", "rating", "activity_rule_id" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activities` (`user_id`);--> statement-breakpoint
CREATE INDEX `isFocusMode_idx` ON `activities` (`is_focus_mode`);--> statement-breakpoint
CREATE INDEX `timeEntryId_idx` ON `activities` (`timeEntryId`);--> statement-breakpoint
CREATE INDEX `activity_rating_idx` ON `activities` (`rating`);--> statement-breakpoint
CREATE INDEX `activity_match_idx` ON `activities` (`title`,`owner_bundle_id`,`owner_name`,`owner_path`,`platform`,`timeEntryId`);
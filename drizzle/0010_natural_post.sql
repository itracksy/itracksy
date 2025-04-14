PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`app_name` text NOT NULL,
	`domain` text DEFAULT '' NOT NULL,
	`condition` text DEFAULT '',
	`title` text DEFAULT '',
	`duration` integer DEFAULT 0,
	`duration_condition` text,
	`rating` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_activity_rules`("id", "name", "description", "app_name", "domain", "condition", "title", "duration", "duration_condition", "rating", "user_id", "created_at", "active") SELECT "id", "name", "description", "app_name", "domain", "condition", "title", "duration", "duration_condition", "rating", "user_id", "created_at", "active" FROM `activity_rules`;--> statement-breakpoint
DROP TABLE `activity_rules`;--> statement-breakpoint
ALTER TABLE `__new_activity_rules` RENAME TO `activity_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `activity_rules_user_id_idx` ON `activity_rules` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_rules_active_idx` ON `activity_rules` (`active`);--> statement-breakpoint
CREATE INDEX `activity_rules_rating_idx` ON `activity_rules` (`rating`);--> statement-breakpoint
CREATE UNIQUE INDEX `activity_rules_user_id_title_app_name_domain_unique` ON `activity_rules` (`user_id`,`title`,`app_name`,`domain`);--> statement-breakpoint
ALTER TABLE `activities` ADD `activity_rule_id` text REFERENCES activity_rules(id);
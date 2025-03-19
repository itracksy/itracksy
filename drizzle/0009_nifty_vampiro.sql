PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`app_name` text DEFAULT '',
	`domain` text DEFAULT '',
	`rule_type` text NOT NULL,
	`condition` text NOT NULL,
	`value` text NOT NULL,
	`rating` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_activity_rules`("id", "name", "description", "app_name", "domain", "rule_type", "condition", "value", "rating", "user_id", "created_at", "active") SELECT "id", "name", "description", "app_name", "domain", "rule_type", "condition", "value", "rating", "user_id", "created_at", "active" FROM `activity_rules`;--> statement-breakpoint
DROP TABLE `activity_rules`;--> statement-breakpoint
ALTER TABLE `__new_activity_rules` RENAME TO `activity_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `activity_rules_user_id_idx` ON `activity_rules` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_rules_rule_type_idx` ON `activity_rules` (`rule_type`);--> statement-breakpoint
CREATE INDEX `activity_rules_active_idx` ON `activity_rules` (`active`);--> statement-breakpoint
CREATE UNIQUE INDEX `activity_rules_user_id_rule_type_condition_value_app_name_domain_rating_unique` ON `activity_rules` (`user_id`,`rule_type`,`condition`,`value`,`app_name`,`domain`,`rating`);
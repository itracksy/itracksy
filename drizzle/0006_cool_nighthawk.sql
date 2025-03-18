CREATE TABLE `activity_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rule_type` text NOT NULL,
	`condition` text NOT NULL,
	`value` text NOT NULL,
	`rating` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_rules_user_id_idx` ON `activity_rules` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_rules_rule_type_idx` ON `activity_rules` (`rule_type`);--> statement-breakpoint
CREATE INDEX `activity_rules_active_idx` ON `activity_rules` (`active`);--> statement-breakpoint
ALTER TABLE `activities` ADD `rating` integer;
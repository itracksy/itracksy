CREATE TABLE `activity_rules` (
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
CREATE INDEX `activity_rules_user_id_idx` ON `activity_rules` (`user_id`);
CREATE INDEX `activity_rules_rule_type_idx` ON `activity_rules` (`rule_type`);
CREATE INDEX `activity_rules_active_idx` ON `activity_rules` (`active`);
CREATE UNIQUE INDEX `activity_rules_user_id_rule_type_condition_value_app_name_domain_unique` ON `activity_rules` (`user_id`,`rule_type`,`condition`,`value`,`app_name`,`domain`);
ALTER TABLE `activities` ADD `rating` integer;

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`app_name` text NOT NULL,
	`domain` text DEFAULT '',
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
INSERT INTO `__new_activity_rules`("id", "name", "description", "condition", "rating", "user_id", "created_at", "active", "app_name", "domain", "title", "duration", "duration_condition")
SELECT
  "id",
  "name",
  "description",
  "condition",
  "rating",
  "user_id",
  "created_at",
  "active",
  CASE
    WHEN "rule_type" = 'app_name' THEN "value"
    WHEN "app_name" IS NOT NULL AND "app_name" != '' THEN "app_name"
    ELSE ''
  END as "app_name",
  "domain",
  CASE WHEN "rule_type" = 'title' THEN "value" ELSE '' END as "title",
  CASE WHEN "rule_type" = 'duration' THEN CAST("value" AS INTEGER) ELSE 0 END as "duration",
  CASE WHEN "rule_type" = 'duration' THEN "condition" ELSE NULL END as "duration_condition"
FROM `activity_rules`;--> statement-breakpoint
DROP TABLE `activity_rules`;--> statement-breakpoint
ALTER TABLE `__new_activity_rules` RENAME TO `activity_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `activity_rules_user_id_idx` ON `activity_rules` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_rules_active_idx` ON `activity_rules` (`active`);--> statement-breakpoint
CREATE INDEX `activity_rules_rating_idx` ON `activity_rules` (`rating`);--> statement-breakpoint
CREATE UNIQUE INDEX `activity_rules_user_id_duration_duration_condition_condition_title_app_name_domain_unique` ON `activity_rules` (`user_id`,`duration`,`duration_condition`,`condition`,`title`,`app_name`,`domain`);

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blocked_apps` (
	`user_id` text NOT NULL,
	`app_name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `app_name`)
);
--> statement-breakpoint
INSERT INTO `__new_blocked_apps`("user_id", "app_name", "active", "updated_at") SELECT "user_id", "app_name", "active", "updated_at" FROM `blocked_apps`;--> statement-breakpoint
DROP TABLE `blocked_apps`;--> statement-breakpoint
ALTER TABLE `__new_blocked_apps` RENAME TO `blocked_apps`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `blocked_apps_user_idx` ON `blocked_apps` (`user_id`);--> statement-breakpoint
CREATE INDEX `blocked_apps_name_idx` ON `blocked_apps` (`app_name`);--> statement-breakpoint
CREATE TABLE `__new_blocked_domains` (
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `domain`)
);
--> statement-breakpoint
INSERT INTO `__new_blocked_domains`("user_id", "domain", "active", "updated_at") SELECT "user_id", "domain", "active", "updated_at" FROM `blocked_domains`;--> statement-breakpoint
DROP TABLE `blocked_domains`;--> statement-breakpoint
ALTER TABLE `__new_blocked_domains` RENAME TO `blocked_domains`;--> statement-breakpoint
CREATE INDEX `blocked_domains_user_idx` ON `blocked_domains` (`user_id`);--> statement-breakpoint
CREATE INDEX `blocked_domains_domain_idx` ON `blocked_domains` (`domain`);
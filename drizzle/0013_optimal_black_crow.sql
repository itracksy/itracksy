CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`parent_id` text,
	`path` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `categories_user_id_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_id_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `categories_path_idx` ON `categories` (`path`);--> statement-breakpoint
CREATE INDEX `categories_level_idx` ON `categories` (`level`);--> statement-breakpoint
CREATE INDEX `categories_system_idx` ON `categories` (`is_system`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_user_id_name_parent_id_unique` ON `categories` (`user_id`,`name`,`parent_id`);--> statement-breakpoint
CREATE TABLE `category_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`app_name` text,
	`domain` text,
	`title_pattern` text,
	`match_type` text DEFAULT 'exact' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `category_mappings_category_id_idx` ON `category_mappings` (`category_id`);--> statement-breakpoint
CREATE INDEX `category_mappings_user_id_idx` ON `category_mappings` (`user_id`);--> statement-breakpoint
CREATE INDEX `category_mappings_app_name_idx` ON `category_mappings` (`app_name`);--> statement-breakpoint
CREATE INDEX `category_mappings_domain_idx` ON `category_mappings` (`domain`);--> statement-breakpoint
CREATE INDEX `category_mappings_priority_idx` ON `category_mappings` (`priority`);--> statement-breakpoint
CREATE INDEX `category_mappings_active_idx` ON `category_mappings` (`is_active`);--> statement-breakpoint
CREATE INDEX `category_mappings_match_idx` ON `category_mappings` (`app_name`,`domain`,`is_active`);--> statement-breakpoint
ALTER TABLE `activities` ADD `category_id` text REFERENCES categories(id);
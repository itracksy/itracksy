CREATE TABLE `activities` (
	`activity_id` integer NOT NULL,
	`platform` text NOT NULL,
	`title` text NOT NULL,
	`owner_path` text NOT NULL,
	`owner_process_id` integer NOT NULL,
	`owner_bundle_id` text,
	`owner_name` text NOT NULL,
	`url` text,
	`timestamp` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`task_id` integer,
	`is_focused` integer DEFAULT false,
	`user_id` text
);

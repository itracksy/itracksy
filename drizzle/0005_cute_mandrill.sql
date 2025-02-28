ALTER TABLE `activities` ADD `is_focus_mode` integer;--> statement-breakpoint
CREATE INDEX `isFocusMode_idx` ON `activities` (`is_focus_mode`);
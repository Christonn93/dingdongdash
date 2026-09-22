ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
ALTER TABLE `friendship` ADD `requested_by` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`area_city` text,
	`area_country` text,
	`avatar_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`dnd_enabled` integer DEFAULT false NOT NULL,
	`dnd_from` integer DEFAULT 22 NOT NULL,
	`dnd_to` integer DEFAULT 8 NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`id` text PRIMARY KEY,
	`image` text,
	`name` text NOT NULL,
	`phone_hash` text UNIQUE,
	`points` integer DEFAULT 100 NOT NULL,
	`time_shield_armed` integer DEFAULT false NOT NULL,
	`time_shields` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`username` text UNIQUE
);
--> statement-breakpoint
INSERT INTO `__new_user`(`area_city`, `area_country`, `avatar_id`, `created_at`, `dnd_enabled`, `dnd_from`, `dnd_to`, `email`, `email_verified`, `id`, `image`, `name`, `phone_hash`, `points`, `time_shield_armed`, `time_shields`, `updated_at`) SELECT `area_city`, `area_country`, `avatar_id`, `created_at`, `dnd_enabled`, `dnd_from`, `dnd_to`, `email`, `email_verified`, `id`, `image`, `name`, `phone_hash`, `points`, `time_shield_armed`, `time_shields`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
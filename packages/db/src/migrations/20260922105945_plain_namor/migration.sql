PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
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
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`created_at`, `email`, `email_verified`, `id`, `image`, `name`, `phone_hash`, `points`, `time_shields`, `time_shield_armed`, `dnd_enabled`, `dnd_from`, `dnd_to`, `updated_at`) SELECT `created_at`, `email`, `email_verified`, `id`, `image`, `name`, `phone_hash`, `points`, `time_shields`, `time_shield_armed`, `dnd_enabled`, `dnd_from`, `dnd_to`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
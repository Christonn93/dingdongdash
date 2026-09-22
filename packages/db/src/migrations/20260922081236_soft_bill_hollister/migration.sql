CREATE TABLE `invite` (
	`code` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_invite_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `invite_userId_idx` ON `invite` (`user_id`);
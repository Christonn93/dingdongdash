CREATE TABLE `owned_ring_sound` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY,
	`sound_id` text NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_owned_ring_sound_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `user` ADD `ring_sound_id` text DEFAULT 'dingdong' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `owned_ring_sound_user_sound_unique` ON `owned_ring_sound` (`user_id`,`sound_id`);--> statement-breakpoint
CREATE INDEX `owned_ring_sound_userId_idx` ON `owned_ring_sound` (`user_id`);
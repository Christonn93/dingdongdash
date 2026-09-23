CREATE TABLE `owned_door_skin` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`door_skin_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_owned_door_skin_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `user` ADD `door_skin_id` text DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `camera_doorbell` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `spy_camera` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `owned_door_skin_user_skin_unique` ON `owned_door_skin` (`user_id`,`door_skin_id`);--> statement-breakpoint
CREATE INDEX `owned_door_skin_userId_idx` ON `owned_door_skin` (`user_id`);
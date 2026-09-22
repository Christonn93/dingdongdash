CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`phone_hash` text UNIQUE,
	`points` integer DEFAULT 1000 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `device_token` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`platform` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_device_token_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `friendship` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_friendship_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_friendship_friend_id_user_id_fk` FOREIGN KEY (`friend_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`ring_id` text,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_points_ledger_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_points_ledger_ring_id_ring_id_fk` FOREIGN KEY (`ring_id`) REFERENCES `ring`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `purchase` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`product_id` text NOT NULL,
	`points_granted` integer,
	`item_granted` text,
	`amount_paid_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`platform_transaction_id` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_purchase_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `ring` (
	`id` text PRIMARY KEY,
	`ringer_id` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`duration_ms` integer DEFAULT 30000 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolved_at` integer,
	`durable_object_id` text,
	CONSTRAINT `fk_ring_ringer_id_user_id_fk` FOREIGN KEY (`ringer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_ring_target_id_user_id_fk` FOREIGN KEY (`target_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `device_token_token_unique` ON `device_token` (`token`);--> statement-breakpoint
CREATE INDEX `device_token_userId_idx` ON `device_token` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `friendship_user_friend_unique` ON `friendship` (`user_id`,`friend_id`);--> statement-breakpoint
CREATE INDEX `friendship_friendId_idx` ON `friendship` (`friend_id`);--> statement-breakpoint
CREATE INDEX `points_ledger_userId_idx` ON `points_ledger` (`user_id`);--> statement-breakpoint
CREATE INDEX `points_ledger_ringId_idx` ON `points_ledger` (`ring_id`);--> statement-breakpoint
CREATE INDEX `purchase_userId_idx` ON `purchase` (`user_id`);--> statement-breakpoint
CREATE INDEX `ring_targetId_status_idx` ON `ring` (`target_id`,`status`);--> statement-breakpoint
CREATE INDEX `ring_ringerId_idx` ON `ring` (`ringer_id`);
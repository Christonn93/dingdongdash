CREATE TABLE `notification_preference` (
	`user_id` text PRIMARY KEY,
	`rings_push` integer DEFAULT true NOT NULL,
	`rings_email` integer DEFAULT true NOT NULL,
	`rings_sms` integer DEFAULT false NOT NULL,
	`results_push` integer DEFAULT true NOT NULL,
	`results_email` integer DEFAULT false NOT NULL,
	`results_sms` integer DEFAULT false NOT NULL,
	`sms_phone` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_notification_preference_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

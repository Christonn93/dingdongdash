CREATE TABLE IF NOT EXISTS `avatar` (
	`id` text PRIMARY KEY,
	`image` text NOT NULL,
	`mime` text DEFAULT 'image/png' NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);

ALTER TABLE `user` ADD `dnd_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `dnd_from` integer DEFAULT 22 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `dnd_to` integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE `friendship` ADD `muted` integer DEFAULT false NOT NULL;
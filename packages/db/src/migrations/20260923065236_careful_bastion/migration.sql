-- Ring resolutions were historically applied by read-then-write batches, so a
-- ring could occasionally produce two ledger rows for the same user (double
-- points). Before we can enforce one ledger row per (ring_id, user_id), drop
-- the duplicates — keeping the earliest row per ring+user. Rows without a
-- ring (signup bonus, daily bonus, purchases) are untouched.
DELETE FROM `points_ledger`
WHERE `id` IN (
	SELECT p2.`id`
	FROM `points_ledger` p1
	JOIN `points_ledger` p2
		ON p1.`ring_id` = p2.`ring_id`
		AND p1.`user_id` = p2.`user_id`
		AND p1.`ring_id` IS NOT NULL
	WHERE p2.`id` > p1.`id`
);
--> statement-breakpoint
-- The ledger is the source of truth; the user.points cache is a denormalized
-- copy. Reconcile every drifted cache so reads (leaderboards, profile) agree
-- with the ledger sum after the dedupe above.
UPDATE `user`
SET `points` = (
	SELECT COALESCE(SUM(pl.`amount`), 0)
	FROM `points_ledger` pl
	WHERE pl.`user_id` = `user`.`id`
)
WHERE `points` <> (
	SELECT COALESCE(SUM(pl.`amount`), 0)
	FROM `points_ledger` pl
	WHERE pl.`user_id` = `user`.`id`
);
--> statement-breakpoint
ALTER TABLE `points_ledger` ADD `day` text;--> statement-breakpoint
CREATE UNIQUE INDEX `points_ledger_ring_user_unique` ON `points_ledger` (`ring_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `points_ledger_user_day_unique` ON `points_ledger` (`user_id`,`day`);
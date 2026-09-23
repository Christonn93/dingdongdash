import type { Database } from "@dingdongdash/db";
import {
	ownedDoorSkin,
	ownedRingSound,
	pointsLedger,
	user,
} from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import {
	DEFAULT_DOOR_SKIN,
	DEFAULT_RING_SOUND,
	DOOR_SKINS,
	DOOR_UPGRADES,
	doorSkinById,
	doorUpgradeById,
	RING_SOUNDS,
	ringSoundById,
} from "../lib/door-catalog";

export const doorsRouter = router({
	buyDoor: protectedProcedure
		.input(z.object({ doorSkinId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const skin = doorSkinById(input.doorSkinId);
			if (!skin) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That door doesn't exist",
				});
			}
			if (skin.pricePoints <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That door is already yours",
				});
			}

			const [row] = await db
				.select({ points: user.points })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			const balance = row?.points ?? 0;
			if (balance < skin.pricePoints) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Not enough points for that door",
				});
			}

			// Claim ownership first (idempotent via the unique index), then charge.
			const claimed = await db
				.insert(ownedDoorSkin)
				.values({
					doorSkinId: skin.id,
					id: crypto.randomUUID(),
					userId,
				})
				.onConflictDoNothing()
				.returning({ id: ownedDoorSkin.id });
			if (claimed.length === 0) {
				// Already owned — nothing to charge, just make sure it's equipped.
				await db
					.update(user)
					.set({ doorSkinId: skin.id })
					.where(eq(user.id, userId));
				return { bought: false, points: balance };
			}

			await db.batch([
				db.insert(pointsLedger).values({
					amount: -skin.pricePoints,
					id: crypto.randomUUID(),
					reason: "shop_purchase",
					userId,
				}),
				db
					.update(user)
					.set({
						doorSkinId: skin.id,
						points: sql`${user.points} - ${skin.pricePoints}`,
					})
					.where(eq(user.id, userId)),
			]);

			return { bought: true, points: balance - skin.pricePoints };
		}),

	buySound: protectedProcedure
		.input(z.object({ soundId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const sound = ringSoundById(input.soundId);
			if (!sound) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That sound doesn't exist",
				});
			}
			if (sound.pricePoints <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That sound is already yours",
				});
			}

			const [row] = await db
				.select({ points: user.points })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			const balance = row?.points ?? 0;
			if (balance < sound.pricePoints) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Not enough points for that sound",
				});
			}

			const claimed = await db
				.insert(ownedRingSound)
				.values({
					id: crypto.randomUUID(),
					soundId: sound.id,
					userId,
				})
				.onConflictDoNothing()
				.returning({ id: ownedRingSound.id });
			if (claimed.length === 0) {
				return { bought: false, points: balance };
			}

			await db.batch([
				db.insert(pointsLedger).values({
					amount: -sound.pricePoints,
					id: crypto.randomUUID(),
					reason: "shop_purchase",
					userId,
				}),
				db
					.update(user)
					.set({ points: sql`${user.points} - ${sound.pricePoints}` })
					.where(eq(user.id, userId)),
			]);

			return { bought: true, points: balance - sound.pricePoints };
		}),

	buyUpgrade: protectedProcedure
		.input(z.object({ upgradeId: z.enum(["spy_camera", "camera_doorbell"]) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const upgrade = doorUpgradeById(input.upgradeId);
			if (!upgrade) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That upgrade doesn't exist",
				});
			}
			const column: "cameraDoorbell" | "spyCamera" =
				upgrade.id === "spy_camera" ? "spyCamera" : "cameraDoorbell";

			// One atomic conditional UPDATE claims the upgrade AND charges for it
			// (guards on not-yet-owned + sufficient balance), so two taps can't
			// double-charge. The ledger entry is recorded right after.
			const claimed = await db
				.update(user)
				.set({
					points: sql`${user.points} - ${upgrade.pricePoints}`,
					[column]: true,
				})
				.where(
					and(
						eq(user.id, userId),
						eq(user[column], false),
						gte(user.points, upgrade.pricePoints)
					)
				)
				.returning({ id: user.id, points: user.points });

			if (claimed.length === 0) {
				const [row] = await db
					.select({
						cameraDoorbell: user.cameraDoorbell,
						points: user.points,
						spyCamera: user.spyCamera,
					})
					.from(user)
					.where(eq(user.id, userId))
					.limit(1);
				if (row?.[column] === true) {
					return { bought: false, points: row?.points ?? 0 };
				}
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Not enough points for that upgrade",
				});
			}

			await db.insert(pointsLedger).values({
				amount: -upgrade.pricePoints,
				id: crypto.randomUUID(),
				reason: "shop_purchase",
				userId,
			});

			return { bought: true, points: claimed[0]?.points ?? 0 };
		}),

	equipDoor: protectedProcedure
		.input(z.object({ doorSkinId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const skin = doorSkinById(input.doorSkinId);
			if (!skin) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That door doesn't exist",
				});
			}
			const owns =
				skin.id === DEFAULT_DOOR_SKIN ||
				(await ownsDoorSkin(db, userId, skin.id));
			if (!owns) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't own that door yet",
				});
			}
			await db
				.update(user)
				.set({ doorSkinId: skin.id })
				.where(eq(user.id, userId));
			return { equipped: true };
		}),

	equipSound: protectedProcedure
		.input(z.object({ soundId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const sound = ringSoundById(input.soundId);
			if (!sound) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That sound doesn't exist",
				});
			}
			const owns =
				sound.id === DEFAULT_RING_SOUND ||
				(await ownsRingSound(db, userId, sound.id));
			if (!owns) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't own that sound yet",
				});
			}
			await db
				.update(user)
				.set({ ringSoundId: sound.id })
				.where(eq(user.id, userId));
			return { equipped: true };
		}),
	getCatalog: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const [me] = await db
			.select({
				cameraDoorbell: user.cameraDoorbell,
				doorSkinId: user.doorSkinId,
				ringSoundId: user.ringSoundId,
				spyCamera: user.spyCamera,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		const ownedRows = await db
			.select({ doorSkinId: ownedDoorSkin.doorSkinId })
			.from(ownedDoorSkin)
			.where(eq(ownedDoorSkin.userId, session.user.id));
		const ownedSkins = new Set(ownedRows.map((row) => row.doorSkinId));
		ownedSkins.add(DEFAULT_DOOR_SKIN);

		const soundRows = await db
			.select({ soundId: ownedRingSound.soundId })
			.from(ownedRingSound)
			.where(eq(ownedRingSound.userId, session.user.id));
		const ownedSounds = new Set(soundRows.map((row) => row.soundId));
		ownedSounds.add(DEFAULT_RING_SOUND);

		const ownedUpgrades = new Map<"spy_camera" | "camera_doorbell", boolean>();
		for (const upgrade of DOOR_UPGRADES) {
			const column: "cameraDoorbell" | "spyCamera" =
				upgrade.id === "spy_camera" ? "spyCamera" : "cameraDoorbell";
			ownedUpgrades.set(upgrade.id, me?.[column] === true);
		}

		return {
			cameraDoorbell: me?.cameraDoorbell ?? false,
			doorSkinId: me?.doorSkinId ?? DEFAULT_DOOR_SKIN,
			ringSoundId: me?.ringSoundId ?? DEFAULT_RING_SOUND,
			skins: DOOR_SKINS.map((skin) => ({
				description: skin.description,
				equipped: me?.doorSkinId === skin.id,
				id: skin.id,
				name: skin.name,
				owned: ownedSkins.has(skin.id),
				pricePoints: skin.pricePoints,
			})),
			sounds: RING_SOUNDS.map((sound) => ({
				description: sound.description,
				equipped: me?.ringSoundId === sound.id,
				id: sound.id,
				name: sound.name,
				owned: ownedSounds.has(sound.id),
				pricePoints: sound.pricePoints,
			})),
			spyCamera: me?.spyCamera ?? false,
			upgrades: DOOR_UPGRADES.map((upgrade) => ({
				description: upgrade.description,
				id: upgrade.id,
				name: upgrade.name,
				owned: ownedUpgrades.get(upgrade.id) ?? false,
				pricePoints: upgrade.pricePoints,
				revealsRinger: upgrade.revealsRinger,
			})),
		};
	}),
});

async function ownsDoorSkin(
	db: Database,
	userId: string,
	doorSkinId: string
): Promise<boolean> {
	const rows = await db
		.select({ id: ownedDoorSkin.id })
		.from(ownedDoorSkin)
		.where(
			and(
				eq(ownedDoorSkin.userId, userId),
				eq(ownedDoorSkin.doorSkinId, doorSkinId)
			)
		)
		.limit(1);
	return rows.length > 0;
}

async function ownsRingSound(
	db: Database,
	userId: string,
	soundId: string
): Promise<boolean> {
	const rows = await db
		.select({ id: ownedRingSound.id })
		.from(ownedRingSound)
		.where(
			and(
				eq(ownedRingSound.userId, userId),
				eq(ownedRingSound.soundId, soundId)
			)
		)
		.limit(1);
	return rows.length > 0;
}

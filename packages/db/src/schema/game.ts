import { defineRelationsPart, sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { RING_DURATION_MS } from "../game";
import { user } from "./auth";

const timestamp = {
	mode: "timestamp_ms",
} as const;

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const friendshipStatus = ["pending", "accepted", "blocked"] as const;
export const ringStatus = ["pending", "caught", "ditched"] as const;
export const ledgerReason = [
	"signup_bonus",
	"catch",
	"ditch_penalty",
	"ditch_ring_penalty",
	"purchase",
	"adjustment",
] as const;
export const devicePlatform = ["ios", "android"] as const;
export const purchaseItem = ["time_shield", "points_pack", "cosmetic"] as const;

export const deviceToken = sqliteTable(
	"device_token",
	{
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		id: text("id").primaryKey(),
		platform: text("platform", { enum: devicePlatform }).notNull(),
		token: text("token").notNull(),
		updatedAt: integer("updated_at", timestamp)
			.default(now)
			.$onUpdate(() => new Date())
			.notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("device_token_token_unique").on(table.token),
		index("device_token_userId_idx").on(table.userId),
	]
);

export const friendship = sqliteTable(
	"friendship",
	{
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		friendId: text("friend_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		id: text("id").primaryKey(),
		muted: integer("muted", { mode: "boolean" }).default(false).notNull(),
		status: text("status", { enum: friendshipStatus })
			.default("pending")
			.notNull(),
		updatedAt: integer("updated_at", timestamp)
			.default(now)
			.$onUpdate(() => new Date())
			.notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("friendship_user_friend_unique").on(
			table.userId,
			table.friendId
		),
		index("friendship_friendId_idx").on(table.friendId),
	]
);

export const ring = sqliteTable(
	"ring",
	{
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		durableObjectId: text("durable_object_id"),
		durationMs: integer("duration_ms").default(RING_DURATION_MS).notNull(),
		expiresAt: integer("expires_at", timestamp).notNull(),
		id: text("id").primaryKey(),
		resolvedAt: integer("resolved_at", timestamp),
		ringerId: text("ringer_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status", { enum: ringStatus }).default("pending").notNull(),
		targetId: text("target_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("ring_targetId_status_idx").on(table.targetId, table.status),
		index("ring_ringerId_idx").on(table.ringerId),
	]
);

export const pointsLedger = sqliteTable(
	"points_ledger",
	{
		amount: integer("amount").notNull(),
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		id: text("id").primaryKey(),
		reason: text("reason", { enum: ledgerReason }).notNull(),
		ringId: text("ring_id").references(() => ring.id, { onDelete: "set null" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("points_ledger_userId_idx").on(table.userId),
		index("points_ledger_ringId_idx").on(table.ringId),
	]
);

export const invite = sqliteTable(
	"invite",
	{
		code: text("code").primaryKey(),
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		expiresAt: integer("expires_at", timestamp).notNull(),
		usedCount: integer("used_count").default(0).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("invite_userId_idx").on(table.userId)]
);

export const notificationPreference = sqliteTable("notification_preference", {
	resultsEmail: integer("results_email", { mode: "boolean" })
		.default(false)
		.notNull(),
	resultsPush: integer("results_push", { mode: "boolean" })
		.default(true)
		.notNull(),
	resultsSms: integer("results_sms", { mode: "boolean" })
		.default(false)
		.notNull(),
	ringsEmail: integer("rings_email", { mode: "boolean" })
		.default(true)
		.notNull(),
	ringsPush: integer("rings_push", { mode: "boolean" }).default(true).notNull(),
	ringsSms: integer("rings_sms", { mode: "boolean" }).default(false).notNull(),
	smsPhone: text("sms_phone"),
	updatedAt: integer("updated_at", timestamp)
		.default(now)
		.$onUpdate(() => new Date())
		.notNull(),
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const purchase = sqliteTable(
	"purchase",
	{
		amountPaidCents: integer("amount_paid_cents").notNull(),
		createdAt: integer("created_at", timestamp).default(now).notNull(),
		currency: text("currency").default("USD").notNull(),
		id: text("id").primaryKey(),
		itemGranted: text("item_granted", { enum: purchaseItem }),
		platform: text("platform", { enum: devicePlatform }).notNull(),
		platformTransactionId: text("platform_transaction_id").notNull().unique(),
		pointsGranted: integer("points_granted"),
		productId: text("product_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("purchase_userId_idx").on(table.userId)]
);

export const gameRelations = defineRelationsPart(
	{
		deviceToken,
		friendship,
		invite,
		notificationPreference,
		pointsLedger,
		purchase,
		ring,
		user,
	},
	(r) => ({
		deviceToken: {
			user: r.one.user({
				from: r.deviceToken.userId,
				to: r.user.id,
			}),
		},
		friendship: {
			friend: r.one.user({
				from: r.friendship.friendId,
				to: r.user.id,
			}),
			user: r.one.user({
				from: r.friendship.userId,
				to: r.user.id,
			}),
		},
		invite: {
			user: r.one.user({
				from: r.invite.userId,
				to: r.user.id,
			}),
		},
		notificationPreference: {
			user: r.one.user({
				from: r.notificationPreference.userId,
				to: r.user.id,
			}),
		},
		pointsLedger: {
			ring: r.one.ring({
				from: r.pointsLedger.ringId,
				to: r.ring.id,
			}),
			user: r.one.user({
				from: r.pointsLedger.userId,
				to: r.user.id,
			}),
		},
		purchase: {
			user: r.one.user({
				from: r.purchase.userId,
				to: r.user.id,
			}),
		},
		ring: {
			ringer: r.one.user({
				from: r.ring.ringerId,
				to: r.user.id,
			}),
			target: r.one.user({
				from: r.ring.targetId,
				to: r.user.id,
			}),
		},
		user: {
			deviceTokens: r.many.deviceToken({
				from: r.user.id,
				to: r.deviceToken.userId,
			}),
			friendships: r.many.friendship({
				from: r.user.id,
				to: r.friendship.userId,
			}),
			invites: r.many.invite({
				from: r.user.id,
				to: r.invite.userId,
			}),
			ledgerEntries: r.many.pointsLedger({
				from: r.user.id,
				to: r.pointsLedger.userId,
			}),
			purchases: r.many.purchase({
				from: r.user.id,
				to: r.purchase.userId,
			}),
			ringsReceived: r.many.ring({
				from: r.user.id,
				to: r.ring.targetId,
			}),
			ringsSent: r.many.ring({
				from: r.user.id,
				to: r.ring.ringerId,
			}),
		},
	})
);

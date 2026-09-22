import {
	deviceToken,
	friendship,
	notificationPreference,
	user,
} from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const phoneHashRegex = /^[0-9a-f]{64}$/;

export const usersRouter = router({
	armTimeShield: protectedProcedure.mutation(async ({ ctx }) => {
		const { db, session } = ctx;
		const [row] = await db
			.select({
				timeShieldArmed: user.timeShieldArmed,
				timeShields: user.timeShields,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		if (!row) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}
		if (row.timeShieldArmed) {
			return { armed: true };
		}
		if (row.timeShields < 1) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "You don't have any Time Shields",
			});
		}
		await db
			.update(user)
			.set({
				timeShieldArmed: true,
				timeShields: sql`${user.timeShields} - 1`,
			})
			.where(eq(user.id, session.user.id));
		return { armed: true };
	}),

	getDndSettings: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const [row] = await db
			.select({
				dndEnabled: user.dndEnabled,
				dndFrom: user.dndFrom,
				dndTo: user.dndTo,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		return {
			dndEnabled: row?.dndEnabled ?? false,
			dndFrom: row?.dndFrom ?? 22,
			dndTo: row?.dndTo ?? 8,
		};
	}),
	getInventory: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const [row] = await db
			.select({
				timeShieldArmed: user.timeShieldArmed,
				timeShields: user.timeShields,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		return {
			timeShieldArmed: row?.timeShieldArmed ?? false,
			timeShields: row?.timeShields ?? 0,
		};
	}),

	getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const [row] = await db
			.select()
			.from(notificationPreference)
			.where(eq(notificationPreference.userId, session.user.id))
			.limit(1);
		return (
			row ?? {
				resultsEmail: false,
				resultsPush: true,
				resultsSms: false,
				ringsEmail: true,
				ringsPush: true,
				ringsSms: false,
				smsPhone: null,
				userId: session.user.id,
			}
		);
	}),
	me: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const me = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		const [meRow] = me;
		if (!meRow) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const [friendRow] = await db
			.select({ count: sql<number>`count(*)` })
			.from(friendship)
			.where(
				and(eq(friendship.userId, meRow.id), eq(friendship.status, "accepted"))
			);

		return {
			friendCount: friendRow?.count ?? 0,
			user: meRow,
		};
	}),

	registerDeviceToken: protectedProcedure
		.input(
			z.object({
				platform: z.enum(["ios", "android"]),
				token: z.string().min(1).max(512),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const existing = await db
				.select()
				.from(deviceToken)
				.where(eq(deviceToken.token, input.token))
				.limit(1);

			if (existing[0]) {
				await db
					.update(deviceToken)
					.set({ platform: input.platform, userId: session.user.id })
					.where(eq(deviceToken.token, input.token));
			} else {
				await db.insert(deviceToken).values({
					id: crypto.randomUUID(),
					platform: input.platform,
					token: input.token,
					userId: session.user.id,
				});
			}

			return { registered: true };
		}),

	updateDndSettings: protectedProcedure
		.input(
			z
				.object({
					dndEnabled: z.boolean().optional(),
					dndFrom: z.number().int().min(0).max(23).optional(),
					dndTo: z.number().int().min(0).max(23).optional(),
				})
				.refine((value) => Object.keys(value).length > 0, {
					message: "Nothing to update",
				})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			await db
				.update(user)
				.set({
					...(input.dndEnabled === undefined
						? {}
						: { dndEnabled: input.dndEnabled }),
					...(input.dndFrom === undefined ? {} : { dndFrom: input.dndFrom }),
					...(input.dndTo === undefined ? {} : { dndTo: input.dndTo }),
				})
				.where(eq(user.id, session.user.id));
			return { updated: true };
		}),

	updateNotificationPreferences: protectedProcedure
		.input(
			z
				.object({
					resultsEmail: z.boolean().optional(),
					resultsPush: z.boolean().optional(),
					resultsSms: z.boolean().optional(),
					ringsEmail: z.boolean().optional(),
					ringsPush: z.boolean().optional(),
					ringsSms: z.boolean().optional(),
					smsPhone: z
						.string()
						.regex(
							/^\+[1-9][0-9]{6,14}$/,
							"Use a full number like +15550001234"
						)
						.nullable()
						.optional(),
				})
				.refine((value) => Object.keys(value).length > 0, {
					message: "Nothing to update",
				})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;
			const values = {
				...(input.ringsEmail === undefined
					? {}
					: { ringsEmail: input.ringsEmail }),
				...(input.ringsPush === undefined
					? {}
					: { ringsPush: input.ringsPush }),
				...(input.ringsSms === undefined ? {} : { ringsSms: input.ringsSms }),
				...(input.resultsEmail === undefined
					? {}
					: { resultsEmail: input.resultsEmail }),
				...(input.resultsPush === undefined
					? {}
					: { resultsPush: input.resultsPush }),
				...(input.resultsSms === undefined
					? {}
					: { resultsSms: input.resultsSms }),
				...(input.smsPhone === undefined ? {} : { smsPhone: input.smsPhone }),
			};

			await db
				.insert(notificationPreference)
				.values({ ...values, userId })
				.onConflictDoUpdate({
					set: values,
					target: notificationPreference.userId,
				});

			const [row] = await db
				.select()
				.from(notificationPreference)
				.where(eq(notificationPreference.userId, userId))
				.limit(1);
			return row;
		}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().trim().min(2).max(50).optional(),
				phoneHash: z
					.string()
					.regex(phoneHashRegex, "phoneHash must be a SHA-256 hex digest")
					.optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			if (input.name === undefined && input.phoneHash === undefined) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Nothing to update",
				});
			}

			try {
				await db
					.update(user)
					.set({
						...(input.name === undefined ? {} : { name: input.name }),
						...(input.phoneHash === undefined
							? {}
							: { phoneHash: input.phoneHash }),
					})
					.where(eq(user.id, session.user.id));
			} catch (error) {
				if (error instanceof Error && error.message.includes("phone_hash")) {
					// biome-ignore lint/style/useErrorCause: TRPCError options object already carries cause
					throw new TRPCError({
						cause: error,
						code: "CONFLICT",
						message: "That phone number is already linked to another account",
					});
				}
				throw error;
			}

			const updated = await db
				.select()
				.from(user)
				.where(eq(user.id, session.user.id))
				.limit(1);
			return updated[0];
		}),
});

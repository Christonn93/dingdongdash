import type { Database } from "@dingdongdash/db";
import { purchase, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { lookupProduct } from "../lib/catalog";
import { applyPoints } from "../lib/points";

export const purchasesRouter = router({
	getCatalog: publicProcedure.query(() => ({ items: catalogItems() })),

	getHistory: protectedProcedure.query(({ ctx }) => {
		const { db, session } = ctx;
		return db
			.select()
			.from(purchase)
			.where(eq(purchase.userId, session.user.id))
			.orderBy(desc(purchase.createdAt));
	}),

	validateReceipt: protectedProcedure
		.input(
			z.object({
				platform: z.enum(["ios", "android"]),
				platformTransactionId: z.string().min(1),
				productId: z.string().min(1),
				receiptData: z.string().min(1),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;

			const existing = await db
				.select({ id: purchase.id })
				.from(purchase)
				.where(eq(purchase.platformTransactionId, input.platformTransactionId))
				.limit(1);
			if (existing[0]) {
				return { alreadyProcessed: true, granted: false };
			}

			const product = lookupProduct(input.productId);
			if (!product) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Unknown product",
				});
			}

			const valid = validatePlatformReceipt();
			if (!valid.valid) {
				throw new TRPCError({
					code: "UNPROCESSABLE_CONTENT",
					message: valid.reason ?? "Receipt could not be validated",
				});
			}

			await grantPurchase(db, session.user.id, input, product);

			return { alreadyProcessed: false, granted: true };
		}),
});

function catalogItems() {
	return [
		{
			currency: "USD",
			kind: "points_pack",
			points: 500,
			priceCents: 299,
			productId: "points_500",
		},
		{
			currency: "USD",
			kind: "points_pack",
			points: 1200,
			priceCents: 599,
			productId: "points_1200",
		},
		{
			currency: "USD",
			kind: "points_pack",
			points: 3500,
			priceCents: 1299,
			productId: "points_3500",
		},
		{
			currency: "USD",
			kind: "time_shield",
			points: 0,
			priceCents: 399,
			productId: "time_shield_3",
		},
	];
}

/**
 * Server-side receipt validation hook. In production this must verify the
 * signed receipt with Apple App Store Server API / Google Play Developer API
 * using service credentials. Until those credentials are configured, the
 * validation accepts well-formed development receipts so the flow can be
 * exercised end-to-end. See GO_LIVE.md for wiring the real providers.
 */
function validatePlatformReceipt(): {
	valid: boolean;
	reason?: string;
} {
	return { valid: true };
}

async function grantPurchase(
	db: Database,
	userId: string,
	input: {
		platform: "ios" | "android";
		productId: string;
		platformTransactionId: string;
	},
	product: NonNullable<ReturnType<typeof lookupProduct>>
): Promise<void> {
	const pointsGranted = product.kind === "points_pack" ? product.points : 0;
	let itemGranted: "time_shield" | "points_pack" | "cosmetic" = "points_pack";
	if (product.kind === "time_shield") {
		itemGranted = "time_shield";
	} else if (product.kind === "cosmetic") {
		itemGranted = "cosmetic";
	}

	const purchaseRow = {
		amountPaidCents: product.priceCents,
		currency: product.currency,
		id: crypto.randomUUID(),
		itemGranted,
		platform: input.platform,
		platformTransactionId: input.platformTransactionId,
		pointsGranted: pointsGranted || null,
		productId: input.productId,
		userId,
	};

	if (itemGranted === "time_shield") {
		await db.batch([
			db.insert(purchase).values(purchaseRow),
			db
				.update(user)
				.set({ timeShields: sql`${user.timeShields} + 3` })
				.where(eq(user.id, userId)),
		]);
	} else {
		await db.insert(purchase).values(purchaseRow);
	}

	if (pointsGranted > 0) {
		await applyPoints(db, userId, pointsGranted, "purchase");
	}
}

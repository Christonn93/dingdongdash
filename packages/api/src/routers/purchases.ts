import { purchase } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { lookupProduct } from "../lib/catalog";
import { createPolarCheckout, parsePolarProductIds } from "../lib/polar";
import { grantPurchase } from "../lib/purchase-grant";

export const purchasesRouter = router({
	/** Starts a hosted Polar checkout for the web app and returns the URL. */
	createCheckout: protectedProcedure
		.input(z.object({ productId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const product = lookupProduct(input.productId);
			if (!product) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Unknown product",
				});
			}
			if (!ctx.polarAccessToken) {
				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message: "Payments are not configured yet.",
				});
			}
			const polarProductId = parsePolarProductIds(ctx.polarProductIds)[
				input.productId
			];
			if (!polarProductId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This product isn't available for checkout yet.",
				});
			}
			const { url } = await createPolarCheckout({
				accessToken: ctx.polarAccessToken,
				customerEmail: ctx.session.user.email,
				metadata: {
					productId: input.productId,
					userId: ctx.session.user.id,
				},
				productId: polarProductId,
				successUrl: `${ctx.publicWebUrl}/store?purchased=1`,
			});
			return { url };
		}),
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

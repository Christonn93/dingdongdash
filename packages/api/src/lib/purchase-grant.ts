import type { Database } from "@dingdongdash/db";
import { pointsLedger, purchase, user } from "@dingdongdash/db/schema";
import { eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import type { CatalogItem } from "./catalog";

export type PurchasePlatform = "ios" | "android" | "web";

export interface GrantPurchaseInput {
	platform: PurchasePlatform;
	platformTransactionId: string;
	productId: string;
}

/** Persists a paid purchase and grants its points / items to the user.
 * Everything — purchase row, points ledger entry, points cache, item grant —
 * lands in ONE atomic D1 batch, so a crash mid-way can never leave a paid
 * purchase with missing points (or points with no purchase row). */
export async function grantPurchase(
	db: Database,
	userId: string,
	input: GrantPurchaseInput,
	product: CatalogItem
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

	const writes: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
		db.insert(purchase).values(purchaseRow),
	];
	if (itemGranted === "time_shield") {
		writes.push(
			db
				.update(user)
				.set({ timeShields: sql`${user.timeShields} + 3` })
				.where(eq(user.id, userId))
		);
	}
	if (pointsGranted > 0) {
		writes.push(
			db.insert(pointsLedger).values({
				amount: pointsGranted,
				id: crypto.randomUUID(),
				reason: "purchase",
				userId,
			}),
			db
				.update(user)
				.set({ points: sql`${user.points} + ${pointsGranted}` })
				.where(eq(user.id, userId))
		);
	}

	await db.batch(writes);
}

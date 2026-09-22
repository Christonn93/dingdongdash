import type { Database } from "@dingdongdash/db";
import { purchase, user } from "@dingdongdash/db/schema";
import { eq, sql } from "drizzle-orm";

import type { CatalogItem } from "./catalog";
import { applyPoints } from "./points";

export type PurchasePlatform = "ios" | "android" | "web";

export interface GrantPurchaseInput {
	platform: PurchasePlatform;
	platformTransactionId: string;
	productId: string;
}

/** Persists a paid purchase and grants its points / items to the user. */
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

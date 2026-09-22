import type { Database } from "@dingdongdash/db";
import { user } from "@dingdongdash/db/schema";
import { eq } from "drizzle-orm";

export interface DetectedRegion {
	areaCity: string | null;
	areaCountry: string | null;
}

/** Persist an IP-detected region onto a user row. */
export async function persistRegion(
	db: Database,
	userId: string,
	region: DetectedRegion
): Promise<void> {
	await db
		.update(user)
		.set({
			areaCity: region.areaCity,
			areaCountry: region.areaCountry,
		})
		.where(eq(user.id, userId));
}

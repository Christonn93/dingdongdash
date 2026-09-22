import type { Database } from "@dingdongdash/db";
import { avatar } from "@dingdongdash/db/schema";
import { eq } from "drizzle-orm";

/** Fetch an avatar's raw image data for the `/avatars/:id` serving route. */
export async function getAvatarImage(db: Database, id: string) {
	const [row] = await db
		.select({ image: avatar.image, mime: avatar.mime })
		.from(avatar)
		.where(eq(avatar.id, id))
		.limit(1);
	return row ?? null;
}

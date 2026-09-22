import { avatar } from "@dingdongdash/db/schema";
import { asc } from "drizzle-orm";

import { publicProcedure, router } from "../index";

export const avatarsRouter = router({
	/** The fixed avatar catalog, ordered for the picker. */
	list: publicProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({ id: avatar.id, name: avatar.name })
			.from(avatar)
			.orderBy(asc(avatar.sortOrder));
		return rows;
	}),
});

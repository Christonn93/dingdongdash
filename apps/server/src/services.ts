import { createAuth as createConfiguredAuth } from "@dingdongdash/auth";
import { createDb, type Database } from "@dingdongdash/db";

import { desktopOrigins, ENV, liveOrigins } from "./env.server";

export function getDb(): Database {
	return createDb(ENV);
}
export async function createAuth(database?: Database) {
	return createConfiguredAuth(ENV, database ?? (await getDb()), [
		...desktopOrigins,
		...liveOrigins,
	]);
}

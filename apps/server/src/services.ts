import { createAuth as createConfiguredAuth } from "@dingdongdash/auth";
import { type Database, createDb } from "@dingdongdash/db";

import { ENV, desktopOrigins } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()), desktopOrigins);
}

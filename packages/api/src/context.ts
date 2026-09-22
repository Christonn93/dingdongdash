import type { Session } from "@dingdongdash/auth";
import type { Database } from "@dingdongdash/db";

export type Context = {
  session: Session | null;
  db: Database;
};

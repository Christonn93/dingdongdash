import type { Session } from "@dingdongdash/auth";
import type { Database } from "@dingdongdash/db";

// biome-ignore lint/style/useConsistentTypeDefinitions: type alias required so trpc-server's Record<string, unknown> constraint accepts it (interfaces lack implicit index signatures)
export type Context = {
	db: Database;
	emailFrom: string;
	expoAccessToken: string;
	polarAccessToken: string;
	polarProductIds: string;
	polarWebhookSecret: string;
	publicWebUrl: string;
	resendApiKey: string;
	session: Session | null;
	vonageApiKey: string;
	vonageApiSecret: string;
	vonageFromNumber: string;
};

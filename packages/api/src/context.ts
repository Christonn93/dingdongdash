import type { Session } from "@dingdongdash/auth";
import type { Database } from "@dingdongdash/db";

// biome-ignore lint/style/useConsistentTypeDefinitions: type alias required so trpc-server's Record<string, unknown> constraint accepts it (interfaces lack implicit index signatures)
export type Context = {
	db: Database;
	emailFrom: string;
	expoAccessToken: string;
	polarAccessToken: string;
	polarProductIds: string;
	polarSandboxAccessToken: string;
	polarSandboxProductIds: string;
	polarSandboxWebhookSecret: string;
	polarWebhookSecret: string;
	publicWebUrl: string;
	resendApiKey: string;
	session: Session | null;
	stripePriceIds: string;
	stripeSecretKey: string;
	stripeWebhookSecret: string;
	vonageApiKey: string;
	vonageApiSecret: string;
	vonageFromNumber: string;
};

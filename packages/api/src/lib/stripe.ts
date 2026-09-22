import { createHmac, timingSafeEqual } from "node:crypto";

export const STRIPE_API_URL = "https://api.stripe.com";

/** Parses the STRIPE_PRICE_IDS env (JSON mapping our productId -> Stripe price id). */
export function parseStripePriceIds(value: string): Record<string, string> {
	if (!value) {
		return {};
	}
	try {
		return JSON.parse(value) as Record<string, string>;
	} catch {
		return {};
	}
}

export interface StripePriceParams {
	currency: string;
	priceCents: number;
}

interface CheckoutMetadata {
	productId: string;
	userId: string;
}

/** Creates a Stripe Checkout Session and returns the hosted checkout URL. */
export async function createStripeCheckout(opts: {
	customerEmail: string;
	metadata: CheckoutMetadata;
	price: StripePriceParams;
	priceId: string;
	secretKey: string;
	successUrl: string;
}): Promise<{ url: string }> {
	const body = new URLSearchParams({
		cancel_url: opts.successUrl.replace("?purchased=1", ""),
		client_reference_id: opts.metadata.userId,
		customer_email: opts.customerEmail,
		"line_items[0][price]": opts.priceId,
		"line_items[0][quantity]": "1",
		"metadata[productId]": opts.metadata.productId,
		"metadata[userId]": opts.metadata.userId,
		mode: "payment",
		success_url: opts.successUrl,
	});
	// Fall back to an ad-hoc one-time price when no catalog Stripe price is mapped.
	if (!opts.priceId) {
		body.set(
			"line_items[0][price_data][currency]",
			opts.price.currency.toLowerCase()
		);
		body.set(
			"line_items[0][price_data][product_data][name]",
			opts.metadata.productId
		);
		body.set(
			"line_items[0][price_data][unit_amount]",
			String(opts.price.priceCents)
		);
	}

	const response = await fetch(`${STRIPE_API_URL}/v1/checkout/sessions`, {
		body: body.toString(),
		headers: {
			authorization: `Bearer ${opts.secretKey}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		method: "POST",
	});
	if (!response.ok) {
		const bodyText = await response.text();
		throw new Error(`Stripe checkout failed (${response.status}): ${bodyText}`);
	}
	const data = (await response.json()) as { url?: string };
	if (!data.url) {
		throw new Error("Stripe checkout returned no URL");
	}
	return { url: data.url };
}

const STRIPE_TIMESTAMP = /t=(\d+)/;
const STRIPE_SIGNATURE = /v1=([^,]+)/;

/** Verifies the HMAC-SHA256 signature Stripe sends in the `stripe-signature` header. */
export function verifyStripeSignature(
	rawBody: string,
	signatureHeader: string,
	secret: string
): boolean {
	const timestamp = signatureHeader.match(STRIPE_TIMESTAMP)?.[1];
	const signature = signatureHeader.match(STRIPE_SIGNATURE)?.[1];
	if (!(timestamp && signature)) {
		return false;
	}
	const expected = createHmac("sha256", secret)
		.update(`${timestamp}.${rawBody}`)
		.digest("hex");
	const received = Buffer.from(signature, "hex");
	const computed = Buffer.from(expected, "hex");
	return (
		received.length === computed.length && timingSafeEqual(received, computed)
	);
}

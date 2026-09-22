import { createHmac, timingSafeEqual } from "node:crypto";

export const POLAR_SANDBOX_URL = "https://sandbox-api.polar.sh";

/** Parses the POLAR_PRODUCT_IDS env (JSON mapping our productId -> Polar product id). */
export function parsePolarProductIds(value: string): Record<string, string> {
	if (!value) {
		return {};
	}
	try {
		return JSON.parse(value) as Record<string, string>;
	} catch {
		return {};
	}
}

/** Creates a Polar checkout session and returns the hosted checkout URL. */
export async function createPolarCheckout(opts: {
	accessToken: string;
	baseUrl?: string;
	customerEmail: string;
	metadata: Record<string, string>;
	productId: string;
	successUrl: string;
}): Promise<{ url: string }> {
	const baseUrl = opts.baseUrl ?? "https://api.polar.sh";
	const response = await fetch(`${baseUrl}/v1/checkouts/`, {
		body: JSON.stringify({
			customer_email: opts.customerEmail,
			metadata: opts.metadata,
			products: [opts.productId],
			success_url: opts.successUrl,
		}),
		headers: {
			authorization: `Bearer ${opts.accessToken}`,
			"content-type": "application/json",
		},
		method: "POST",
	});
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Polar checkout failed (${response.status}): ${body}`);
	}
	const data = (await response.json()) as { url?: string };
	if (!data.url) {
		throw new Error("Polar checkout returned no URL");
	}
	return { url: data.url };
}

/** Verifies the HMAC-SHA256 signature Polar sends in the `polar-signature` header. */
export function verifyPolarSignature(
	rawBody: string,
	signatureHeader: string,
	secret: string
): boolean {
	const signature = extractSignature(signatureHeader);
	if (!signature) {
		return false;
	}
	const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
	const received = Buffer.from(signature, "hex");
	const computed = Buffer.from(expected, "hex");
	return (
		received.length === computed.length && timingSafeEqual(received, computed)
	);
}

const SIGNATURE_SEPARATOR = /[\s,]+/;

function extractSignature(header: string): string {
	if (!header) {
		return "";
	}
	if (header.includes("=")) {
		const part = header
			.split(SIGNATURE_SEPARATOR)
			.map((pair) => pair.split("="))
			.find(([key]) => key === "v1");
		return part?.[1] ?? "";
	}
	return header.trim();
}

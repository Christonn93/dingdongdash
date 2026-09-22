export interface SmsSendResult {
	message?: string;
	status: "ok" | "skipped" | "error";
}

/** Sends an SMS via the Vonage SMS API. No-op (skipped) when the Vonage
 * credentials are not configured. */
export async function sendSms(
	apiKey: string,
	apiSecret: string,
	fromNumber: string,
	toNumber: string,
	body: string
): Promise<SmsSendResult> {
	if (!(apiKey && apiSecret && fromNumber && toNumber)) {
		return { status: "skipped" };
	}

	const params = new URLSearchParams({
		api_key: apiKey,
		api_secret: apiSecret,
		from: fromNumber,
		text: body,
		to: toNumber,
		type: "unicode",
	});

	const response = await fetch("https://rest.nexmo.com/sms/json", {
		body: params.toString(),
		headers: { "content-type": "application/x-www-form-urlencoded" },
		method: "POST",
	});

	if (!response.ok) {
		return {
			message: `Vonage request failed (${response.status})`,
			status: "error",
		};
	}

	const bodyJson = (await response.json()) as {
		messages?: Array<{ status?: string; "error-text"?: string }>;
	};
	const first = bodyJson.messages?.[0];
	if (first && first.status !== "0") {
		return {
			message: first["error-text"] ?? "Vonage rejected the message",
			status: "error",
		};
	}

	return { status: "ok" };
}

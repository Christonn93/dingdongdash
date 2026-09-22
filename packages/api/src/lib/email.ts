export type EmailSendResult = {
	status: "ok" | "skipped" | "error";
	message?: string;
};

/** Sends a transactional email via Resend. No-op (skipped) when no API key or
 * sender address is configured. */
export async function sendEmail(
	apiKey: string,
	from: string,
	to: string,
	subject: string,
	html: string
): Promise<EmailSendResult> {
	if (!(apiKey && from && to)) {
		return { status: "skipped" };
	}

	const response = await fetch("https://api.resend.com/emails", {
		body: JSON.stringify({
			from,
			html,
			subject,
			to: [to],
		}),
		headers: {
			authorization: `Bearer ${apiKey}`,
			"content-type": "application/json",
		},
		method: "POST",
	});

	if (!response.ok) {
		return {
			message: `Resend request failed (${response.status})`,
			status: "error",
		};
	}
	return { status: "ok" };
}

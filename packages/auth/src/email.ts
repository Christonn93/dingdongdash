export interface AuthEmailEnv {
	EMAIL_FROM: string;
	RESEND_API_KEY: string;
}

const DUMMY_KEYS = new Set(["re_dummy_key", "re_test_key", "re_placeholder"]);

/**
 * Resend requires a sender that exists on a verified domain. The project's
 * placeholder uses @example.com, which can never be verified — fall back to
 * Resend's shared test domain so a real API key alone is enough to send.
 */
function resolveFrom(emailFrom: string): string {
	const configured = emailFrom.trim();
	if (configured && !configured.includes("@example.com")) {
		return configured;
	}
	return "DingDongDitch <onboarding@resend.dev>";
}

export type EmailSendStatus = "sent" | "skipped" | "error";

/** Sends a transactional email via Resend. Returns the outcome instead of
 * swallowing failures so callers can surface problems to the user. */
export async function sendAuthEmail(
	env: AuthEmailEnv,
	to: string,
	subject: string,
	html: string
): Promise<EmailSendStatus> {
	const key = env.RESEND_API_KEY.trim();
	if (!key || DUMMY_KEYS.has(key)) {
		return "skipped";
	}
	try {
		const response = await fetch("https://api.resend.com/emails", {
			body: JSON.stringify({
				from: resolveFrom(env.EMAIL_FROM),
				html,
				subject,
				to: [to],
			}),
			headers: {
				authorization: `Bearer ${key}`,
				"content-type": "application/json",
			},
			method: "POST",
		});
		return response.ok ? "sent" : "error";
	} catch {
		return "error";
	}
}

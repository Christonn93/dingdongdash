export interface AuthEmailEnv {
	EMAIL_FROM: string;
	RESEND_API_KEY: string;
}

/** Sends a transactional email via Resend. No-op when credentials are absent. */
export async function sendAuthEmail(
	env: AuthEmailEnv,
	to: string,
	subject: string,
	html: string
): Promise<void> {
	if (!(env.RESEND_API_KEY && env.EMAIL_FROM)) {
		return;
	}
	try {
		await fetch("https://api.resend.com/emails", {
			body: JSON.stringify({
				from: env.EMAIL_FROM,
				html,
				subject,
				to: [to],
			}),
			headers: {
				authorization: `Bearer ${env.RESEND_API_KEY}`,
				"content-type": "application/json",
			},
			method: "POST",
		});
	} catch {
		// Never break sign-up/sign-in when the email provider is unavailable.
	}
}
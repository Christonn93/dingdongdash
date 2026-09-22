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

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export interface BrandedEmailOptions {
	body: string;
	ctaHref: string;
	ctaLabel: string;
	title: string;
}

/** Renders a branded, email-client-safe HTML template (same look as game emails). */
export function renderBrandedEmail({
	body,
	ctaHref,
	ctaLabel,
	title,
}: BrandedEmailOptions): string {
	return `<!doctype html>
<html lang="en">
<body style="background:#f6efe3;font-family:Inter,Helvetica,Arial,sans-serif;margin:0;padding:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:36px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <tr>
          <td align="center" style="padding:0 0 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#4f46e5;border-radius:10px;padding:8px 10px;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:18px;font-weight:800;font-family:Helvetica,Arial,sans-serif;">DD</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="color:#1c1917;font-size:20px;font-weight:800;font-family:Helvetica,Arial,sans-serif;">DingDongDitch</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:16px;padding:28px 28px 32px;">
            <h1 style="color:#1c1917;font-size:20px;font-weight:800;line-height:1.3;margin:0 0 10px;">${escapeHtml(title)}</h1>
            <p style="color:#57534e;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(body)}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr><td><a href="${escapeHtml(ctaHref)}" style="background:#f0563d;border-radius:9999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:700;padding:12px 28px;text-decoration:none;">${escapeHtml(ctaLabel)}</a></td></tr></table>
          </td>
        </tr>
        <tr>
          <td align="center" style="color:#a8a29e;font-size:12px;padding:18px 0 0;">
            Ring the doorbell. Beat the clock.<br/>DingDongDitch
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

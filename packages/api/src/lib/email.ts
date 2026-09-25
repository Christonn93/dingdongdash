export interface EmailSendResult {
	message?: string;
	status: "ok" | "skipped" | "error";
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
	ctaHref?: string;
	ctaLabel?: string;
	eyebrow?: string;
	title: string;
}

/** Renders a branded, email-client-safe HTML template. */
export function renderBrandedEmail({
	body,
	ctaHref,
	ctaLabel,
	eyebrow,
	title,
}: BrandedEmailOptions): string {
	const cta =
		ctaHref && ctaLabel
			? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr><td><a href="${escapeHtml(ctaHref)}" style="background:#f0563d;border-radius:9999px;color:#ffffff;display:inline-block;font-size:15px;font-weight:700;padding:12px 28px;text-decoration:none;">${escapeHtml(ctaLabel)}</a></td></tr></table>`
			: "";
	const kicker = eyebrow
		? `<p style="color:#f0563d;font-size:12px;font-weight:700;letter-spacing:0.08em;margin:0 0 6px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>`
		: "";
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
            ${kicker}
            <h1 style="color:#1c1917;font-size:20px;font-weight:800;line-height:1.3;margin:0 0 10px;">${escapeHtml(title)}</h1>
            <p style="color:#57534e;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(body)}</p>
            ${cta}
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

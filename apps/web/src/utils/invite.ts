export async function shareInvite(url: string): Promise<"shared" | "copied"> {
	if (navigator.share) {
		try {
			await navigator.share({
				text: "Let's be friends and ring each other's doorbell!",
				title: "Join me on DingDongDitch",
				url,
			});
			return "shared";
		} catch {
			// user dismissed the share sheet — fall through to clipboard
		}
	}

	await navigator.clipboard.writeText(url);
	return "copied";
}

export type InterruptionLevel =
	| "active"
	| "critical"
	| "passive"
	| "timeSensitive";

export interface PushMessage {
	body: string;
	data?: Record<string, unknown>;
	interruptionLevel?: InterruptionLevel;
	sound?: string;
	title: string;
	to: string[];
}

export interface PushReceipt {
	details?: unknown;
	message?: string;
	status: "ok" | "error";
}

/** Sends push notifications through the Expo Push API. Auth is optional for
 * development; pass an EXPO_ACCESS_TOKEN for production traffic. */
export async function sendExpoPush(
	accessToken: string,
	messages: PushMessage[]
): Promise<PushReceipt> {
	if (messages.length === 0) {
		return { status: "ok" };
	}

	const response = await fetch("https://exp.host/--/api/v2/push/send", {
		body: JSON.stringify(messages),
		headers: {
			"content-type": "application/json",
			...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
		},
		method: "POST",
	});

	const body = (await response.json()) as {
		data?: Array<{ status?: string; message?: string }>;
	};

	if (!response.ok) {
		return {
			details: body,
			message: `Expo push request failed (${response.status})`,
			status: "error",
		};
	}

	const failed = (body.data ?? []).filter(
		(entry) => entry.status === "error" || entry.status === undefined
	);
	if (failed.length > 0) {
		return {
			details: failed,
			message: "Some push deliveries failed",
			status: "error",
		};
	}

	return { status: "ok" };
}

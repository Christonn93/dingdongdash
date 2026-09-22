import type { Database } from "@dingdongdash/db";
import {
	deviceToken,
	notificationPreference,
	user,
} from "@dingdongdash/db/schema";
import { eq } from "drizzle-orm";

import type { Context } from "../context";
import { sendEmail } from "./email";
import { sendExpoPush } from "./push";
import { sendSms } from "./sms";

export type NotifyEvent = "ring" | "caught" | "ditched";

export interface NotifyPayload {
	body: string;
	data?: Record<string, unknown>;
	title: string;
}

export interface NotificationChannels {
	email: boolean;
	push: boolean;
	sms: boolean;
}

const DEFAULT_PREFS = {
	resultsEmail: false,
	resultsPush: true,
	resultsSms: false,
	ringsEmail: true,
	ringsPush: true,
	ringsSms: false,
	smsPhone: null as string | null,
};

export async function getNotificationPreference(db: Database, userId: string) {
	const [row] = await db
		.select()
		.from(notificationPreference)
		.where(eq(notificationPreference.userId, userId))
		.limit(1);
	if (!row) {
		return { ...DEFAULT_PREFS, userId };
	}
	return row;
}

/** Dispatch a game event across the user's enabled channels. Returns a report
 * of what was attempted/sent so callers can log or debug. */
export async function notifyUser(
	ctx: Pick<
		Context,
		| "db"
		| "expoAccessToken"
		| "resendApiKey"
		| "emailFrom"
		| "vonageApiKey"
		| "vonageApiSecret"
		| "vonageFromNumber"
	>,
	userId: string,
	event: NotifyEvent,
	payload: NotifyPayload
): Promise<NotificationChannels> {
	const prefs = await getNotificationPreference(ctx.db, userId);
	const channel = event === "ring" ? "rings" : "results";
	const pushEnabled = prefs[`${channel}Push`];
	const emailEnabled = prefs[`${channel}Email`];
	const smsEnabled = prefs[`${channel}Sms`];

	const report: NotificationChannels = {
		email: false,
		push: false,
		sms: false,
	};

	if (pushEnabled) {
		const tokens = await ctx.db
			.select({ token: deviceToken.token })
			.from(deviceToken)
			.where(eq(deviceToken.userId, userId));
		if (tokens.length > 0) {
			await sendExpoPush(ctx.expoAccessToken, [
				{
					body: payload.body,
					data: payload.data,
					interruptionLevel: event === "ring" ? "timeSensitive" : "active",
					sound: "default",
					title: payload.title,
					to: tokens.map((t) => t.token),
				},
			]);
			report.push = true;
		}
	}

	if (emailEnabled) {
		const [row] = await ctx.db
			.select({ email: user.email })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		if (row?.email) {
			const result = await sendEmail(
				ctx.resendApiKey,
				ctx.emailFrom,
				row.email,
				payload.title,
				`<p>${payload.body}</p>`
			);
			report.email = result.status === "ok";
		}
	}

	if (smsEnabled && prefs.smsPhone) {
		const result = await sendSms(
			ctx.vonageApiKey,
			ctx.vonageApiSecret,
			ctx.vonageFromNumber,
			prefs.smsPhone,
			`${payload.title} ${payload.body}`
		);
		report.sms = result.status === "ok";
	}

	return report;
}

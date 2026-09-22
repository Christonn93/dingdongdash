import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { Checkbox } from "@dingdongdash/ui/components/checkbox";
import { Input } from "@dingdongdash/ui/components/input";
import { Label } from "@dingdongdash/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { hashPhoneNumber, normalizePhoneNumber } from "@/utils/contacts";
import { trpc } from "@/utils/trpc";

const SMS_PHONE_REGEX = /^\+[1-9][0-9]{6,14}$/;

export const Route = createFileRoute("/_auth/profile")({
	component: ProfileRoute,
});

function ProfileRoute() {
	const { session } = Route.useRouteContext();
	const [phone, setPhone] = useState("");

	const me = useQuery(trpc.users.me.queryOptions(undefined));
	const ledger = useQuery(
		trpc.points.getLedger.queryOptions({ cursor: undefined, limit: 20 })
	);
	const notifPrefs = useQuery(
		trpc.users.getNotificationPreferences.queryOptions()
	);
	const [smsPhone, setSmsPhone] = useState("");

	const updateNotif = useMutation(
		trpc.users.updateNotificationPreferences.mutationOptions({
			onError: (error) => toast.error(error.message),
		})
	);

	type BooleanPrefKey =
		| "resultsEmail"
		| "resultsPush"
		| "resultsSms"
		| "ringsEmail"
		| "ringsPush"
		| "ringsSms";

	const handleNotifToggle = useCallback(
		(key: BooleanPrefKey, value: boolean) => {
			updateNotif.mutate({ [key]: value });
		},
		[updateNotif]
	);

	const handleSaveSms = useCallback(() => {
		if (!SMS_PHONE_REGEX.test(smsPhone)) {
			toast.error("Use a full number like +15550001234");
			return;
		}
		updateNotif.mutate({ smsPhone });
		setSmsPhone("");
	}, [smsPhone, updateNotif]);

	const handleSmsSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			handleSaveSms();
		},
		[handleSaveSms]
	);

	const handleSmsPhoneChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setSmsPhone(event.target.value);
		},
		[]
	);

	const linkPhone = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Phone linked for contact matching");
				setPhone("");
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const user = me.data?.user ?? session.data?.user;
	const points = me.data?.user?.points;
	const hasLinkedPhone = Boolean(me.data?.user?.phoneHash);
	const entries = ledger.data?.entries ?? [];

	const handleLinkPhone = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const normalized = normalizePhoneNumber(phone);
			if (normalized.length < 7) {
				toast.error("Enter a valid phone number");
				return;
			}
			const phoneHash = await hashPhoneNumber(normalized);
			linkPhone.mutate({ phoneHash });
		},
		[linkPhone, phone]
	);

	const handlePhoneChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setPhone(event.target.value);
		},
		[]
	);

	const handleUnlink = useCallback(() => {
		linkPhone.mutate({ phoneHash: undefined });
	}, [linkPhone]);

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6 py-8">
			<div className="rounded-lg border p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-semibold text-2xl">{user?.name}</h1>
						<p className="text-muted-foreground text-sm">{user?.email}</p>
					</div>
					<div className="text-right">
						<p className="font-bold text-3xl">{points ?? "…"}</p>
						<p className="text-muted-foreground text-xs">points</p>
					</div>
				</div>
				<p className="mt-3 text-muted-foreground text-sm">
					{me.data?.friendCount ?? 0} friends
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Contact matching</CardTitle>
					<CardDescription>
						Link your number so friends who have you in their contacts can find
						you. Stored as a one-way hash.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{hasLinkedPhone ? (
						<div className="flex items-center justify-between">
							<span className="inline-flex items-center rounded-full bg-green-600/10 px-2 py-0.5 font-medium text-green-600 text-xs dark:text-green-400">
								Phone linked
							</span>
							<Button onClick={handleUnlink} size="sm" variant="outline">
								Unlink
							</Button>
						</div>
					) : (
						<form
							className="flex flex-col gap-3 sm:flex-row sm:items-end"
							onSubmit={handleLinkPhone}
						>
							<div className="flex-1">
								<Label htmlFor="phone">Phone number</Label>
								<Input
									autoComplete="tel"
									id="phone"
									onChange={handlePhoneChange}
									placeholder="+1 555 000 1234"
									type="tel"
									value={phone}
								/>
							</div>
							<Button
								disabled={linkPhone.isPending || !phone.trim()}
								type="submit"
							>
								{linkPhone.isPending ? "Linking…" : "Link"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Notifications</CardTitle>
					<CardDescription>
						Choose how DingDongDitch reaches you. Ring alerts should stay on if
						you want to catch your friends.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<PrefGroup
						onToggle={handleNotifToggle}
						prefix="rings"
						prefs={notifPrefs.data}
						title="Incoming rings"
					/>
					<PrefGroup
						onToggle={handleNotifToggle}
						prefix="results"
						prefs={notifPrefs.data}
						title="Ring results"
					/>
					{notifPrefs.data?.ringsSms || notifPrefs.data?.resultsSms ? (
						<form
							className="flex flex-col gap-3 sm:flex-row sm:items-end"
							onSubmit={handleSmsSubmit}
						>
							<div className="flex-1">
								<Label htmlFor="sms-phone">SMS phone number</Label>
								<Input
									autoComplete="tel"
									id="sms-phone"
									onChange={handleSmsPhoneChange}
									placeholder={notifPrefs.data?.smsPhone ?? "+15550001234"}
									type="tel"
									value={smsPhone}
								/>
							</div>
							<Button disabled={!smsPhone.trim()} type="submit">
								Save
							</Button>
						</form>
					) : null}
				</CardContent>
			</Card>

			<div className="rounded-lg border p-6">
				<h2 className="mb-4 font-medium">Point history</h2>
				{ledger.isLoading ? (
					<p className="text-muted-foreground text-sm">Loading…</p>
				) : null}
				{!ledger.isLoading && entries.length === 0 ? (
					<p className="text-muted-foreground text-sm">No activity yet.</p>
				) : null}
				<ul className="divide-y">
					{entries.map((entry) => (
						<li
							className="flex items-center justify-between py-2"
							key={entry.id}
						>
							<div>
								<p className="text-sm capitalize">{entry.reason}</p>
								<p className="text-muted-foreground text-xs">
									{new Date(entry.createdAt).toLocaleString()}
								</p>
							</div>
							<p
								className={
									entry.amount >= 0
										? "font-semibold text-green-600"
										: "font-semibold text-red-600"
								}
							>
								{entry.amount >= 0 ? "+" : ""}
								{entry.amount}
							</p>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

interface PrefData {
	resultsEmail: boolean;
	resultsPush: boolean;
	resultsSms: boolean;
	ringsEmail: boolean;
	ringsPush: boolean;
	ringsSms: boolean;
	smsPhone: string | null;
}

type BooleanPrefKey =
	| "resultsEmail"
	| "resultsPush"
	| "resultsSms"
	| "ringsEmail"
	| "ringsPush"
	| "ringsSms";

function PrefGroup({
	title,
	prefs,
	onToggle,
	prefix,
}: {
	title: string;
	prefs: PrefData | undefined;
	onToggle: (key: BooleanPrefKey, value: boolean) => void;
	prefix: "rings" | "results";
}) {
	if (!prefs) {
		return (
			<div>
				<p className="mb-2 font-medium text-sm">{title}</p>
				<p className="text-muted-foreground text-sm">Loading…</p>
			</div>
		);
	}

	const rows: Array<{
		label: string;
		key:
			| `${"rings" | "results"}Push`
			| `${"rings" | "results"}Email`
			| `${"rings" | "results"}Sms`;
	}> = [
		{ label: "Push notifications", key: `${prefix}Push` },
		{ label: "Email", key: `${prefix}Email` },
		{ label: "SMS", key: `${prefix}Sms` },
	];

	return (
		<div>
			<p className="mb-2 font-medium text-sm">{title}</p>
			<div className="space-y-2">
				{rows.map((row) => (
					<label
						className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
						htmlFor={`${prefix}-${row.key}`}
						key={row.key}
					>
						<span className="text-sm">{row.label}</span>
						<Checkbox
							checked={prefs[row.key]}
							id={`${prefix}-${row.key}`}
							// biome-ignore lint/performance/noJsxPropsBind: per-row pref toggle
							onCheckedChange={(checked) => onToggle(row.key, checked === true)}
						/>
					</label>
				))}
			</div>
		</div>
	);
}

import { APP_META } from "@dingdongdash/api/lib/app-meta";
import { AppAvatar } from "@dingdongdash/ui/avatars/app-avatar";
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
import { AnimatedNumber } from "@/components/animated-number";
import { Reveal } from "@/components/reveal";
import { hashPhoneNumber, normalizePhoneNumber } from "@/utils/contacts";
import { trpc } from "@/utils/trpc";

const SMS_PHONE_REGEX = /^\+[1-9][0-9]{6,14}$/;

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

function formatArea(city?: string | null, country?: string | null): string {
	if (!(city || country)) {
		return "";
	}
	const label = city && country ? `${city}, ${country}` : (city ?? country);
	return ` · Area: ${label} (approximate)`;
}

export const Route = createFileRoute("/_auth/profile")({
	component: ProfileRoute,
});

function ProfileRoute() {
	const { session } = Route.useRouteContext();
	const [phone, setPhone] = useState("");

	const me = useQuery(trpc.users.me.queryOptions(undefined));
	const avatars = useQuery(trpc.avatars.list.queryOptions());
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

	const avatarMutation = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Avatar updated");
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const [username, setUsername] = useState("");
	const usernameMutation = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Username saved");
				setUsername("");
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleUsernameSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const normalized = username.trim().toLowerCase();
			if (!USERNAME_REGEX.test(normalized)) {
				toast.error("Use 3-24 lowercase letters, numbers, or underscores");
				return;
			}
			usernameMutation.mutate({ username: normalized });
		},
		[username, usernameMutation]
	);

	const handleUsernameChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setUsername(event.target.value);
		},
		[]
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

	const handleSelectAvatar = useCallback(
		(avatarId: string) => {
			avatarMutation.mutate({ avatarId });
		},
		[avatarMutation]
	);

	const handleClearAvatar = useCallback(() => {
		avatarMutation.mutate({ avatarId: null });
	}, [avatarMutation]);

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6 py-8">
			<Reveal>
				<div className="rounded-2xl border p-6">
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<h1 className="truncate font-display font-extrabold text-2xl tracking-tight">
								{user?.name}
							</h1>
							<p className="truncate text-muted-foreground text-sm">
								{user?.email}
							</p>
						</div>
						<div className="shrink-0 text-right">
							<AnimatedNumber
								className="font-display font-extrabold text-3xl text-primary tracking-tight"
								value={points ?? 0}
							/>
							<p className="text-muted-foreground text-xs">points</p>
						</div>
					</div>
					<p className="mt-3 text-muted-foreground text-sm">
						{me.data?.friendCount ?? 0} friends
						{formatArea(me.data?.user.areaCity, me.data?.user.areaCountry)}
					</p>
				</div>
			</Reveal>

			<Reveal index={1}>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Your avatar</CardTitle>
						<CardDescription>
							Pick a little face for your doorstep. It shows up on the door when
							you ring a friend.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<AppAvatar
								avatarId={me.data?.user.avatarId}
								name={user?.name}
								size="lg"
							/>
							<div>
								<p className="font-medium text-sm">{user?.name}</p>
								<p className="text-muted-foreground text-xs">
									{me.data?.user.avatarId
										? "This is how friends see you"
										: "Using your initials for now"}
								</p>
							</div>
						</div>
						<div
							aria-label="Choose an avatar"
							className="grid grid-cols-4 gap-2 sm:grid-cols-8"
							role="radiogroup"
						>
							{avatars.data?.map((avatarOption) => {
								const selected = me.data?.user.avatarId === avatarOption.id;
								return (
									<label
										className={`relative flex cursor-pointer items-center justify-center rounded-full p-1 outline-none transition-transform focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
											selected
												? "ring-2 ring-primary ring-offset-2"
												: "hover:scale-105"
										} ${avatarMutation.isPending ? "cursor-wait opacity-70" : ""}`}
										key={avatarOption.id}
									>
										<input
											checked={selected}
											className="sr-only"
											disabled={avatarMutation.isPending}
											name="avatar"
											onChange={() => handleSelectAvatar(avatarOption.id)}
											type="radio"
											value={avatarOption.id}
										/>
										<AppAvatar avatarId={avatarOption.id} size="md" />
										<span className="sr-only">
											Choose {avatarOption.name} avatar
										</span>
									</label>
								);
							})}
						</div>
						<div className="flex items-center justify-between gap-2">
							{me.data?.user.avatarId ? (
								<Button
									disabled={avatarMutation.isPending}
									onClick={handleClearAvatar}
									size="sm"
									variant="ghost"
								>
									Remove avatar
								</Button>
							) : null}
							{avatarMutation.isPending ? (
								<span className="text-muted-foreground text-xs">Saving…</span>
							) : null}
						</div>
						<div className="border-t pt-4">
							<Label htmlFor="username">Username</Label>
							<form className="mt-2 flex gap-2" onSubmit={handleUsernameSubmit}>
								<Input
									autoCapitalize="none"
									autoComplete="username"
									id="username"
									onChange={handleUsernameChange}
									placeholder={
										me.data?.user.username
											? `@${me.data?.user.username}`
											: "Set a unique @username"
									}
									value={username}
								/>
								<Button
									disabled={usernameMutation.isPending || !username.trim()}
									type="submit"
								>
									{usernameMutation.isPending ? "Saving…" : "Save"}
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>
			</Reveal>

			<Reveal index={2}>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Contact matching</CardTitle>
						<CardDescription>
							Link your number so friends who have you in their contacts can
							find you. Stored as a one-way hash.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{hasLinkedPhone ? (
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 font-medium text-success text-xs">
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
			</Reveal>

			<Reveal index={3}>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Notifications</CardTitle>
						<CardDescription>
							Choose how DingDongDitch reaches you. Ring alerts should stay on
							if you want to catch your friends.
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
			</Reveal>

			<Reveal index={4}>
				<div className="rounded-2xl border p-6">
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
											? "font-semibold text-success"
											: "font-semibold text-destructive"
									}
								>
									{entry.amount >= 0 ? "+" : ""}
									{entry.amount}
								</p>
							</li>
						))}
					</ul>
				</div>
			</Reveal>

			<Reveal index={5}>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">About</CardTitle>
						<CardDescription>
							DingDongDitch is open source under the MIT License.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-muted-foreground text-sm">
						<p>Created by {APP_META.author}.</p>
						<p className="mt-1 font-mono text-xs">{APP_META.fingerprint}</p>
					</CardContent>
				</Card>
			</Reveal>
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
							onCheckedChange={(checked) => onToggle(row.key, checked === true)}
						/>
					</label>
				))}
			</div>
		</div>
	);
}

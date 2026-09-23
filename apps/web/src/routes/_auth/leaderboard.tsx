import { AppAvatar } from "@dingdongdash/ui/avatars/app-avatar";
import { Button } from "@dingdongdash/ui/components/button";
import { Card, CardContent } from "@dingdongdash/ui/components/card";
import { Skeleton } from "@dingdongdash/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	FriendActionButton,
	type FriendRelationship,
} from "@/components/friend-action";
import { Reveal } from "@/components/reveal";
import { trpc } from "@/utils/trpc";

const scopeSchema = z
	.enum(["friends", "all", "area", "score"])
	.optional()
	.default("all");

export const Route = createFileRoute("/_auth/leaderboard")({
	component: LeaderboardRoute,
	validateSearch: z.object({ scope: scopeSchema }),
});

type Scope = "friends" | "all" | "area" | "score";

const TABS: Array<{ key: Scope; label: string }> = [
	{ key: "friends", label: "Friends" },
	{ key: "all", label: "All" },
	{ key: "area", label: "In your area" },
	{ key: "score", label: "Similar score" },
];

function LeaderboardRoute() {
	const search = Route.useSearch();
	const [scope, setScope] = useState<Scope>(search.scope);
	const [offset, setOffset] = useState(0);

	const isGlobal = scope !== "friends";
	const globalScope = scope === "friends" ? "all" : scope;

	const friends = useQuery(
		trpc.leaderboard.getFriends.queryOptions(undefined, {
			refetchInterval: 5000,
		})
	);
	const global = useQuery(
		trpc.leaderboard.getGlobal.queryOptions(
			{ cursor: 0, limit: 25, scope: globalScope },
			{ enabled: isGlobal, refetchInterval: 5000 }
		)
	);
	const more = useQuery(
		trpc.leaderboard.getGlobal.queryOptions(
			{ cursor: offset + 25, limit: 25, scope: globalScope },
			{ enabled: isGlobal && offset > 0, refetchInterval: 5000 }
		)
	);

	const sendRequest = useMutation(
		trpc.friends.sendRequest.mutationOptions({
			onSuccess: async () => {
				toast.success("Friend request sent");
				await refetchDiscovery();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const acceptRequest = useMutation(
		trpc.friends.acceptRequest.mutationOptions({
			onSuccess: async () => {
				toast.success("Friend added!");
				await refetchDiscovery();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	function refetchDiscovery() {
		return Promise.all([friends.refetch(), global.refetch(), more.refetch()]);
	}

	const me = friends.data?.me;
	const globalMe = global.data?.me;
	const rows =
		scope === "friends"
			? (friends.data?.entries ?? [])
			: [...(global.data?.entries ?? []), ...(more.data?.entries ?? [])];
	const loading =
		scope === "friends" ? friends.isLoading : global.isLoading && offset === 0;
	const noRegion =
		isGlobal && !global.data?.region?.city && !global.data?.region?.country;

	const switchScope = (next: Scope) => {
		setScope(next);
		setOffset(0);
	};

	let subtitle = "";
	if (scope === "friends" && me) {
		subtitle = `You're #${me.rank ?? "?"} among friends, #${me.globalRank} globally.`;
	} else if (scope !== "friends" && globalMe) {
		subtitle = `You're #${globalMe.rank} in this list, #${globalMe.globalRank} globally.`;
	}

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6">
					<h1 className="font-display font-extrabold text-2xl tracking-tight">
						Leaderboard
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Climb the ranks. {subtitle}
					</p>
				</div>
			</Reveal>

			<div className="mb-6 flex flex-wrap gap-2">
				{TABS.map((tab) => (
					<TabButton
						active={scope === tab.key}
						key={tab.key}
						label={tab.label}
						onClick={() => switchScope(tab.key)}
					/>
				))}
			</div>

			{renderBody()}

			{isGlobal && global.data?.nextCursor ? (
				<Button
					className="mt-4 w-full rounded-full"
					onClick={() => setOffset(rows.length)}
					variant="outline"
				>
					Load more
				</Button>
			) : null}
		</div>
	);

	function renderBody() {
		if (scope === "area" && noRegion) {
			return (
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground text-sm">
						We detect your area from your connection automatically — open the
						app once and people nearby will show up here.
					</CardContent>
				</Card>
			);
		}
		if (loading) {
			return <LeaderboardSkeleton />;
		}
		if (isGlobal && globalMe) {
			return (
				<Card>
					<CardContent className="divide-y">
						<Reveal index={0}>
							<Row
								accepting={acceptRequest.isPending}
								avatarId={globalMe.avatarId}
								highlight
								incomingFriendshipId={null}
								name={globalMe.name}
								onAccept={() => undefined}
								onSend={() => undefined}
								points={globalMe.points}
								rank={globalMe.rank}
								relationship="me"
								sending={sendRequest.isPending}
							/>
						</Reveal>
						{rows.map((entry, index) => (
							<Reveal index={index + 1} key={entry.id}>
								<Row
									accepting={acceptRequest.isPending}
									avatarId={entry.avatarId}
									highlight={false}
									incomingFriendshipId={entry.incomingFriendshipId ?? null}
									name={entry.name}
									onAccept={() =>
										acceptRequest.mutate({
											friendshipId: entry.incomingFriendshipId ?? "",
										})
									}
									onSend={() => sendRequest.mutate({ targetUserId: entry.id })}
									points={entry.points}
									rank={entry.rank}
									relationship={entry.relationship as FriendRelationship}
									sending={sendRequest.isPending}
								/>
							</Reveal>
						))}
					</CardContent>
				</Card>
			);
		}
		if (rows.length === 0) {
			return (
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground text-sm">
						No rankings yet. Ring some friends to start climbing.
					</CardContent>
				</Card>
			);
		}
		return (
			<Card>
				<CardContent className="divide-y">
					{rows.map((entry, index) => (
						<Reveal index={index} key={entry.id}>
							<Row
								accepting={acceptRequest.isPending}
								avatarId={entry.avatarId}
								highlight={entry.id === me?.id}
								incomingFriendshipId={entry.incomingFriendshipId ?? null}
								name={entry.name}
								onAccept={() =>
									acceptRequest.mutate({
										friendshipId: entry.incomingFriendshipId ?? "",
									})
								}
								onSend={() => sendRequest.mutate({ targetUserId: entry.id })}
								points={entry.points}
								rank={entry.rank}
								relationship={entry.relationship as FriendRelationship}
								sending={sendRequest.isPending}
							/>
						</Reveal>
					))}
				</CardContent>
			</Card>
		);
	}
}

function TabButton({
	active,
	onClick,
	label,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${
				active
					? "bg-primary text-primary-foreground"
					: "bg-muted text-muted-foreground hover:bg-muted/70"
			}`}
			onClick={onClick}
			type="button"
		>
			{label}
		</button>
	);
}

interface LeaderboardEntry {
	avatarId?: string | null;
	incomingFriendshipId: string | null;
	name: string;
	points: number;
	rank: number;
	relationship: FriendRelationship;
}

function Row({
	accepting,
	avatarId,
	highlight,
	incomingFriendshipId,
	name,
	onAccept,
	onSend,
	points,
	rank,
	relationship,
	sending,
}: LeaderboardEntry & {
	accepting: boolean;
	highlight?: boolean;
	onAccept: () => void;
	onSend: () => void;
	sending: boolean;
}) {
	return (
		<div
			className={`flex items-center justify-between gap-2 px-4 py-3 ${highlight ? "bg-primary/10" : ""}`}
		>
			<div className="flex min-w-0 items-center gap-3">
				<span
					className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold text-xs ${
						rank <= 3
							? "bg-primary text-primary-foreground"
							: "bg-muted text-foreground"
					}`}
				>
					{rank}
				</span>
				<AppAvatar avatarId={avatarId} name={name} size="xs" />
				<span className="truncate font-medium text-foreground text-sm">
					{name}
					{highlight ? " (you)" : ""}
				</span>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<span className="font-semibold text-foreground text-sm">
					{points.toLocaleString()}
				</span>
				<FriendActionButton
					accepting={accepting}
					incomingFriendshipId={incomingFriendshipId}
					onAccept={onAccept}
					onSend={onSend}
					relationship={relationship}
					sending={sending}
				/>
			</div>
		</div>
	);
}

function LeaderboardSkeleton() {
	return (
		<Card>
			<CardContent className="space-y-3 p-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</CardContent>
		</Card>
	);
}

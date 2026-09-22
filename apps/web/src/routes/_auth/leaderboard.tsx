import { Button } from "@dingdongdash/ui/components/button";
import { Card, CardContent } from "@dingdongdash/ui/components/card";
import { Skeleton } from "@dingdongdash/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Reveal } from "@/components/reveal";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/leaderboard")({
	component: LeaderboardRoute,
});

type Scope = "friends" | "global";

function LeaderboardRoute() {
	const [scope, setScope] = useState<Scope>("friends");
	const [offset, setOffset] = useState(0);

	const friends = useQuery(trpc.leaderboard.getFriends.queryOptions());
	const global = useQuery(
		trpc.leaderboard.getGlobal.queryOptions({ cursor: 0, limit: 25 })
	);
	const more = useQuery(
		trpc.leaderboard.getGlobal.queryOptions(
			{ cursor: offset + 25, limit: 25 },
			{ enabled: offset > 0 }
		)
	);

	const me = friends.data?.me;
	const rows =
		scope === "friends"
			? (friends.data?.entries ?? [])
			: [...(global.data?.entries ?? []), ...(more.data?.entries ?? [])];
	const loading =
		scope === "friends" ? friends.isLoading : global.isLoading && offset === 0;

	let content: React.ReactNode;
	if (loading) {
		content = <LeaderboardSkeleton />;
	} else if (rows.length === 0) {
		content = (
			<Card>
				<CardContent className="p-8 text-center text-muted-foreground text-sm">
					No rankings yet. Ring some friends to start climbing.
				</CardContent>
			</Card>
		);
	} else {
		content = (
			<Card>
				<CardContent className="divide-y">
					{rows.map((entry, index) => (
						<Reveal index={index} key={entry.id}>
							<Row
								highlight={entry.id === me?.id}
								name={entry.name}
								points={entry.points}
								rank={entry.rank}
							/>
						</Reveal>
					))}
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6">
					<h1 className="font-display font-extrabold text-2xl tracking-tight">
						Leaderboard
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Climb the ranks.{" "}
						{me
							? `You're #${me.rank ?? "?"} among friends, #${me.globalRank} globally.`
							: ""}
					</p>
				</div>
			</Reveal>

			<div className="mb-6 flex gap-2">
				<TabButton
					active={scope === "friends"}
					label="Friends"
					onClick={() => setScope("friends")}
				/>
				<TabButton
					active={scope === "global"}
					label="Global"
					onClick={() => setScope("global")}
				/>
			</div>

			{content}

			{scope === "global" && global.data?.nextCursor ? (
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

function Row({
	rank,
	name,
	points,
	highlight,
}: {
	rank: number;
	name: string;
	points: number;
	highlight?: boolean;
}) {
	return (
		<div
			className={`flex items-center justify-between px-4 py-3 ${highlight ? "bg-primary/10" : ""}`}
		>
			<div className="flex items-center gap-3">
				<span
					className={`flex h-7 w-7 items-center justify-center rounded-full font-semibold text-xs ${
						rank <= 3
							? "bg-primary text-primary-foreground"
							: "bg-muted text-foreground"
					}`}
				>
					{rank}
				</span>
				<span className="font-medium text-foreground text-sm">
					{name}
					{highlight ? " (you)" : ""}
				</span>
			</div>
			<span className="font-semibold text-foreground text-sm">
				{points.toLocaleString()}
			</span>
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

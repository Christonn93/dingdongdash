import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { Skeleton } from "@dingdongdash/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ActiveRings } from "@/components/active-rings";
import { AnimatedNumber } from "@/components/animated-number";
import { Reveal } from "@/components/reveal";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const me = useQuery(trpc.users.me.queryOptions(undefined));

	const user = me.data?.user ?? session.data?.user;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-8">
					<h1 className="break-words font-display font-extrabold text-2xl tracking-tight">
						Welcome back, {user?.name}
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Someone's doorbell is about to ring.
					</p>
				</div>
			</Reveal>

			<Reveal index={1}>
				<div className="mb-6">
					<ActiveRings />
				</div>
			</Reveal>

			<div className="grid gap-4 sm:grid-cols-2">
				<Reveal index={2}>
					<Card>
						<CardHeader>
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Points
							</CardTitle>
						</CardHeader>
						<CardContent>
							{me.isLoading ? (
								<Skeleton className="h-10 w-24" />
							) : (
								<AnimatedNumber
									className="font-display font-extrabold text-4xl text-primary tracking-tight"
									value={me.data?.user.points ?? 0}
								/>
							)}
							<CardDescription className="mt-1">
								{me.data?.friendCount ?? 0} friends on your block
							</CardDescription>
						</CardContent>
					</Card>
				</Reveal>

				<Reveal index={3}>
					<Card className="border-primary/30 bg-primary/5">
						<CardHeader>
							<CardTitle className="font-medium text-primary text-sm">
								Ready to ring
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">
								Find a friend and send a ring. They have 30 seconds to answer —
								or you walk away with points.
							</p>
							<div className="mt-4 flex gap-2">
								<Link to="/friends">
									<Button className="rounded-full" size="sm">
										Ring a friend
									</Button>
								</Link>
								<Link to="/profile">
									<Button size="sm" variant="outline">
										View points
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</Reveal>
			</div>
		</div>
	);
}

import { AppAvatar } from "@dingdongdash/ui/avatars/app-avatar";
import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { Skeleton } from "@dingdongdash/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FriendActionButton } from "@/components/friend-action";
import { Reveal } from "@/components/reveal";
import { readContactPhoneHashes } from "@/utils/contacts";
import { shareInvite } from "@/utils/invite";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/friends")({
	component: FriendsRoute,
});

function FriendsRoute() {
	const friends = useQuery(
		trpc.friends.list.queryOptions(undefined, { refetchInterval: 5000 })
	);
	const discover = useQuery(
		trpc.friends.discover.queryOptions(undefined, {
			refetchInterval: 30_000,
		})
	);

	const syncMutation = useMutation(
		trpc.friends.importContacts.mutationOptions({
			onSuccess: () => {
				toast.success("Contacts synced");
				friends.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const acceptMutation = useMutation(
		trpc.friends.acceptRequest.mutationOptions({
			onSuccess: () => friends.refetch(),
			onError: (error) => toast.error(error.message),
		})
	);

	const sendRequestMutation = useMutation(
		trpc.friends.sendRequest.mutationOptions({
			onSuccess: () => {
				toast.success("Friend request sent");
				discover.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const inviteMutation = useMutation(
		trpc.friends.createInvite.mutationOptions()
	);

	const ringMutation = useMutation(
		trpc.rings.create.mutationOptions({
			onSuccess: () => toast.success("Doorbell rung!"),
			onError: (error) => toast.error(error.message),
		})
	);

	const muteMutation = useMutation(
		trpc.friends.setMuted.mutationOptions({
			onSuccess: () => friends.refetch(),
		})
	);

	const handleInvite = useCallback(async () => {
		const invite = await inviteMutation.mutateAsync();
		const url = `${window.location.origin}/invite/${invite.code}`;
		const result = await shareInvite(url);
		toast.success(
			result === "shared"
				? "Invite shared"
				: "Invite link copied — send it to a friend"
		);
	}, [inviteMutation]);

	const handleRing = useCallback(
		(targetUserId: string) => {
			ringMutation.mutate({ targetUserId });
		},
		[ringMutation]
	);

	const handleSync = useCallback(async () => {
		try {
			const hashes = await readContactPhoneHashes();
			if (hashes === null) {
				toast.message("Contact syncing needs Chrome on Android", {
					description:
						"Link your phone number in your profile instead, and friends who have you in their contacts will find you.",
				});
				return;
			}
			if (hashes.length === 0) {
				toast.message("No contacts found");
				return;
			}
			syncMutation.mutate({ hashes });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not read contacts"
			);
		}
	}, [syncMutation]);

	const { accepted = [], incoming = [], outgoing = [] } = friends.data ?? {};
	const hasRequests = incoming.length > 0;
	const hasSent = outgoing.length > 0;

	// Light in-app notification: toast when a new request arrives between polls.
	const prevRequestCount = useRef(incoming.length);
	useEffect(() => {
		const previous = prevRequestCount.current;
		prevRequestCount.current = incoming.length;
		if (incoming.length > previous) {
			toast.info("You have a new friend request");
		}
	}, [incoming.length]);

	const handleDiscoverSend = useCallback(
		(targetUserId: string) => {
			sendRequestMutation.mutate({ targetUserId });
		},
		[sendRequestMutation]
	);

	const handleDiscoverAccept = useCallback(
		(friendshipId: string) => {
			acceptMutation.mutate({ friendshipId });
		},
		[acceptMutation]
	);

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6">
					<h1 className="font-display font-extrabold text-2xl tracking-tight">
						Friends
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Ring your friends and grow your circle.
					</p>
				</div>
			</Reveal>

			{friends.isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : (
				<div className="space-y-8">
					<Reveal>
						<Section title="Your friends">
							{accepted.length === 0 ? (
								<EmptyFriends
									invitePending={inviteMutation.isPending}
									onFindContacts={handleSync}
									onInvite={handleInvite}
									syncPending={syncMutation.isPending}
								/>
							) : (
								<div className="space-y-2">
									{accepted.map((friendship) => (
										<Card key={friendship.friendshipId}>
											<CardContent className="flex flex-wrap items-center justify-between gap-3">
												<div className="flex min-w-0 items-center gap-3">
													<AppAvatar
														avatarId={friendship.friend.avatarId}
														name={friendship.friend.name}
														size="sm"
													/>
													<div className="min-w-0">
														<p className="truncate font-medium text-foreground text-sm">
															{friendship.friend.name}
														</p>
														<p className="truncate text-muted-foreground text-xs">
															{friendship.friend.points.toLocaleString()} points
															{friendship.muted ? " · muted" : ""}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Button
														onClick={() =>
															muteMutation.mutate({
																muted: !friendship.muted,
																targetUserId: friendship.friend.id,
															})
														}
														size="sm"
														variant="outline"
													>
														{friendship.muted ? "Unmute" : "Mute"}
													</Button>
													<Button
														disabled={ringMutation.isPending}
														onClick={() => handleRing(friendship.friend.id)}
														size="sm"
													>
														Ring
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</Section>
					</Reveal>

					{hasRequests ? (
						<Reveal index={1}>
							<Section title="Requests">
								<div className="space-y-2">
									{incoming.map((request) => (
										<Card key={request.friendshipId}>
											<CardContent className="flex items-center justify-between gap-3">
												<div className="flex min-w-0 items-center gap-3">
													<AppAvatar
														avatarId={request.requester.avatarId}
														name={request.requester.name}
														size="sm"
													/>
													<div className="min-w-0">
														<p className="truncate font-medium text-foreground text-sm">
															{request.requester.name}
														</p>
														<p className="truncate text-muted-foreground text-xs">
															{request.requester.email}
														</p>
													</div>
												</div>
												<Button
													disabled={acceptMutation.isPending}
													onClick={() =>
														acceptMutation.mutate({
															friendshipId: request.friendshipId,
														})
													}
													size="sm"
												>
													Accept
												</Button>
											</CardContent>
										</Card>
									))}
								</div>
							</Section>
						</Reveal>
					) : null}

					{hasSent ? (
						<Reveal index={2}>
							<Section title="Sent invites">
								<div className="space-y-2">
									{outgoing.map((request) => (
										<Card key={request.friendshipId}>
											<CardContent className="flex items-center justify-between gap-3">
												<div className="flex min-w-0 items-center gap-3">
													<AppAvatar
														avatarId={request.friend.avatarId}
														name={request.friend.name}
														size="sm"
													/>
													<div className="min-w-0">
														<p className="truncate font-medium text-foreground text-sm">
															{request.friend.name}
														</p>
														<p className="text-muted-foreground text-xs">
															Pending
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</Section>
						</Reveal>
					) : null}

					<Reveal index={3}>
						<Section title="Find more friends">
							<div className="mb-4 grid gap-4 sm:grid-cols-2">
								<DiscoveryCard
									empty={
										discover.data?.area.length === 0
											? "No neighbors yet — we detect your area from your connection."
											: "Loading…"
									}
									onAccept={handleDiscoverAccept}
									onSend={handleDiscoverSend}
									rows={discover.data?.area ?? []}
									sending={sendRequestMutation.isPending}
									title="People nearby"
									toScope="area"
								/>
								<DiscoveryCard
									empty={
										discover.data?.similar.length === 0
											? "No one in your score range yet. Keep ringing to climb."
											: "Loading…"
									}
									onAccept={handleDiscoverAccept}
									onSend={handleDiscoverSend}
									rows={discover.data?.similar ?? []}
									sending={sendRequestMutation.isPending}
									title="Similar scores"
									toScope="score"
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<Card>
									<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<CardTitle className="text-base">
												Find friends from your contacts
											</CardTitle>
											<CardDescription>
												Uses a one-way hash of phone numbers — your address book
												never leaves this device.
											</CardDescription>
										</div>
										<Button
											disabled={syncMutation.isPending}
											onClick={handleSync}
										>
											{syncMutation.isPending ? "Syncing…" : "Sync contacts"}
										</Button>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<CardTitle className="text-base">
												Invite a friend by link
											</CardTitle>
											<CardDescription>
												Send a link and they're added as friends the moment they
												open it.
											</CardDescription>
										</div>
										<Button
											disabled={inviteMutation.isPending}
											onClick={handleInvite}
											variant="outline"
										>
											{inviteMutation.isPending ? "Creating…" : "Invite"}
										</Button>
									</CardContent>
								</Card>
							</div>
						</Section>
					</Reveal>
				</div>
			)}
		</div>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h2 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
				{title}
			</h2>
			{children}
		</section>
	);
}

function EmptyFriends({
	invitePending,
	onFindContacts,
	onInvite,
	syncPending,
}: {
	invitePending: boolean;
	onFindContacts: () => void;
	onInvite: () => void;
	syncPending: boolean;
}) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-10 text-center">
			<div className="flex -space-x-3">
				<AppAvatar avatarId="adventurer-1" name="Adventurer 1" size="sm" />
				<AppAvatar avatarId="big-smile-1" name="Big Smile 1" size="sm" />
				<AppAvatar avatarId="bottts-1" name="Bottts 1" size="sm" />
			</div>
			<div className="max-w-sm space-y-1">
				<p className="font-medium text-foreground">
					Your doorstep is quiet for now.
				</p>
				<p className="text-muted-foreground text-sm">
					Invite someone or find friends from your contacts to start ringing.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<Button disabled={invitePending} onClick={onInvite} size="sm">
					{invitePending ? "Creating…" : "Invite a friend"}
				</Button>
				<Button
					disabled={syncPending}
					onClick={onFindContacts}
					size="sm"
					variant="outline"
				>
					{syncPending ? "Syncing…" : "Find contacts"}
				</Button>
			</div>
		</div>
	);
}

interface DiscoveryRow {
	avatarId?: string | null;
	id: string;
	incomingFriendshipId: string | null;
	name: string;
	points: number;
	relationship: "me" | "friend" | "incoming" | "outgoing" | "blocked" | "none";
}

function DiscoveryCard({
	empty,
	onAccept,
	onSend,
	rows,
	sending,
	title,
	toScope,
}: {
	empty: string;
	onAccept: (friendshipId: string) => void;
	onSend: (targetUserId: string) => void;
	rows: DiscoveryRow[];
	sending: boolean;
	title: string;
	toScope: "area" | "score";
}) {
	return (
		<Card>
			<CardContent className="space-y-1">
				<div className="mb-1 flex items-center justify-between gap-2">
					<CardTitle className="text-base">{title}</CardTitle>
					<Link
						className="shrink-0 text-primary text-xs hover:underline"
						search={{ scope: toScope }}
						to="/leaderboard"
					>
						See all
					</Link>
				</div>
				{rows.length === 0 ? (
					<p className="py-3 text-muted-foreground text-sm">{empty}</p>
				) : (
					rows.map((row) => (
						<div
							className="flex items-center justify-between gap-2 py-1.5"
							key={row.id}
						>
							<div className="flex min-w-0 items-center gap-2.5">
								<AppAvatar avatarId={row.avatarId} name={row.name} size="xs" />
								<span className="truncate text-sm">{row.name}</span>
								<span className="shrink-0 text-muted-foreground text-xs">
									{row.points.toLocaleString()} pts
								</span>
							</div>
							<FriendActionButton
								onAccept={() => onAccept(row.incomingFriendshipId ?? "")}
								onSend={() => onSend(row.id)}
								relationship={row.relationship}
								sending={sending}
							/>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

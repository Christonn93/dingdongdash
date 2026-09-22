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
import { useCallback } from "react";
import { toast } from "sonner";
import { ActiveRings } from "@/components/active-rings";
import { Reveal } from "@/components/reveal";
import { readContactPhoneHashes } from "@/utils/contacts";
import { shareInvite } from "@/utils/invite";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/friends")({
	component: FriendsRoute,
});

function FriendsRoute() {
	const friends = useQuery(trpc.friends.list.queryOptions());

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

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6">
					<h1 className="font-display font-extrabold text-2xl tracking-tight">
						Friends
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Ringing requires a mutual friendship. Sync your contacts to find
						friends instantly.
					</p>
				</div>
			</Reveal>

			<div className="mb-6">
				<ActiveRings />
			</div>

			<Reveal index={1}>
				<div className="mb-6 grid gap-4 sm:grid-cols-2">
					<Card>
						<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="text-base">
									Find friends from your contacts
								</CardTitle>
								<CardDescription>
									Uses a one-way hash of phone numbers — your address book never
									leaves this device.
								</CardDescription>
							</div>
							<Button disabled={syncMutation.isPending} onClick={handleSync}>
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
									Send a link and they're added as friends the moment they open
									it.
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
			</Reveal>

			{friends.isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : (
				<Reveal index={2}>
					<div className="space-y-8">
						<Section title="Requests">
							{incoming.length === 0 ? (
								<SectionEmpty />
							) : (
								<div className="space-y-2">
									{incoming.map((request) => (
										<Card key={request.friendshipId}>
											<CardContent className="flex items-center justify-between gap-3">
												<div className="flex min-w-0 items-center gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground text-sm">
														{initials(request.requester.name)}
													</div>
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
							)}
						</Section>

						<Section title="Sent">
							{outgoing.length === 0 ? (
								<SectionEmpty />
							) : (
								<div className="space-y-2">
									{outgoing.map((request) => (
										<Card key={request.friendshipId}>
											<CardContent className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground text-sm">
														{initials(request.friend.name)}
													</div>
													<div>
														<p className="font-medium text-foreground text-sm">
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
							)}
						</Section>

						<Section title="Your friends">
							{accepted.length === 0 ? (
								<div className="rounded-lg border border-dashed p-8 text-center">
									<p className="text-muted-foreground text-sm">
										No friends yet. Sync your contacts or ask a friend to find
										you.
									</p>
									<Link
										className="mt-2 inline-block text-primary text-sm hover:underline"
										to="/profile"
									>
										Link your phone number to get found
									</Link>
								</div>
							) : (
								<div className="space-y-2">
									{accepted.map((friendship) => (
										<Card key={friendship.friendshipId}>
											<CardContent className="flex items-center justify-between gap-3">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-sm">
														{initials(friendship.friend.name)}
													</div>
													<div>
														<p className="font-medium text-foreground text-sm">
															{friendship.friend.name}
														</p>
														<p className="text-muted-foreground text-xs">
															{friendship.friend.points.toLocaleString()} points
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
														variant="ghost"
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
					</div>
				</Reveal>
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

function SectionEmpty() {
	return (
		<p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
			Nothing here yet.
		</p>
	);
}

const WHITESPACE = /\s+/;

function initials(name: string): string {
	return name
		.split(WHITESPACE)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Chip,
	Spinner,
	Surface,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useCallback } from "react";
import { ScrollView, Share, Text, View } from "react-native";

import { Container } from "@/components/container";
import { readContactPhoneHashes } from "@/lib/contacts";
import { trpc } from "@/utils/trpc";

export default function FriendsScreen() {
	const { toast } = useToast();
	const mutedColor = useThemeColor("muted");
	const accentColor = useThemeColor("accent");
	const foregroundColor = useThemeColor("foreground");

	const friends = useQuery(trpc.friends.list.queryOptions());

	const importMutation = useMutation(
		trpc.friends.importContacts.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: () => {
				toast.show({
					label: "Contacts synced",
					variant: "success",
				});
				friends.refetch();
			},
		})
	);

	const acceptMutation = useMutation(
		trpc.friends.acceptRequest.mutationOptions({
			onSuccess: () => friends.refetch(),
		})
	);

	const inviteMutation = useMutation(
		trpc.friends.createInvite.mutationOptions()
	);

	const ringMutation = useMutation(
		trpc.rings.create.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: () => {
				toast.show({ label: "Doorbell rung!", variant: "success" });
			},
		})
	);

	const handleInvite = useCallback(async () => {
		const invite = await inviteMutation.mutateAsync();
		await Share.share({
			message: `Join me on DingDongDitch so we can ring each other: ${invite.url}`,
			title: "Join me on DingDongDitch",
			url: invite.url,
		});
	}, [inviteMutation]);

	const handleRing = useCallback(
		(targetUserId: string) => {
			ringMutation.mutate({ targetUserId });
		},
		[ringMutation]
	);

	const handleImport = async () => {
		try {
			const hashes = await readContactPhoneHashes();
			if (hashes.length === 0) {
				toast.show({ label: "No contacts found", variant: "default" });
				return;
			}
			importMutation.mutate({ hashes });
		} catch (error) {
			toast.show({
				label:
					error instanceof Error ? error.message : "Could not read contacts",
				variant: "danger",
			});
		}
	};

	const { data: friendsData, isLoading } = friends;
	const { accepted = [], incoming = [], outgoing = [] } = friendsData ?? {};

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-2 py-2">
					<Text className="font-semibold text-2xl text-foreground tracking-tight">
						Friends
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Ringing requires a mutual friendship. Sync your contacts to find
						friends instantly.
					</Text>
				</View>

				<Surface className="mb-4 rounded-lg p-3" variant="secondary">
					<View className="gap-2">
						<Button
							className="w-full"
							isDisabled={importMutation.isPending}
							onPress={handleImport}
						>
							{importMutation.isPending ? (
								<Spinner color="default" size="sm" />
							) : (
								<>
									<Ionicons
										color={foregroundColor}
										name="people-outline"
										size={18}
									/>
									<Button.Label>Import Contacts</Button.Label>
								</>
							)}
						</Button>
						<Button
							className="w-full"
							isDisabled={inviteMutation.isPending}
							onPress={handleInvite}
							variant="secondary"
						>
							{inviteMutation.isPending ? (
								<Spinner color="default" size="sm" />
							) : (
								<>
									<Ionicons
										color={foregroundColor}
										name="link-outline"
										size={18}
									/>
									<Button.Label>Invite by link</Button.Label>
								</>
							)}
						</Button>
					</View>
				</Surface>

				{isLoading ? (
					<View className="items-center justify-center py-12">
						<Spinner size="lg" />
						<Text className="mt-3 text-muted text-sm">Loading friends...</Text>
					</View>
				) : null}

				{incoming.length > 0 && (
					<View className="mb-4">
						<Text className="mb-2 font-medium text-foreground">Requests</Text>
						<View className="gap-2">
							{incoming.map((request) => (
								<Surface
									className="rounded-lg p-3"
									key={request.friendshipId}
									variant="secondary"
								>
									<View className="flex-row items-center gap-3">
										<Ionicons
											color={mutedColor}
											name="person-circle-outline"
											size={36}
										/>
										<View className="flex-1">
											<Text className="font-medium text-foreground text-sm">
												{request.requester.name}
											</Text>
											<Text className="text-muted text-xs">
												{request.requester.email}
											</Text>
										</View>
										<Button
											isDisabled={acceptMutation.isPending}
											onPress={() =>
												acceptMutation.mutate({
													friendshipId: request.friendshipId,
												})
											}
											size="sm"
										>
											<Button.Label>Accept</Button.Label>
										</Button>
									</View>
								</Surface>
							))}
						</View>
					</View>
				)}

				{outgoing.length > 0 && (
					<View className="mb-4">
						<Text className="mb-2 font-medium text-foreground">Sent</Text>
						<View className="gap-2">
							{outgoing.map((request) => (
								<Surface
									className="rounded-lg p-3"
									key={request.friendshipId}
									variant="secondary"
								>
									<View className="flex-row items-center gap-3">
										<Ionicons
											color={mutedColor}
											name="person-circle-outline"
											size={36}
										/>
										<View className="flex-1">
											<Text className="font-medium text-foreground text-sm">
												{request.friend.name}
											</Text>
											<Chip color="accent" size="sm" variant="secondary">
												<Chip.Label>Pending</Chip.Label>
											</Chip>
										</View>
									</View>
								</Surface>
							))}
						</View>
					</View>
				)}

				<Text className="mb-2 font-medium text-foreground">Your friends</Text>
				{!isLoading && accepted.length === 0 && (
					<Surface
						className="items-center justify-center rounded-lg py-10"
						variant="secondary"
					>
						<Ionicons color={mutedColor} name="people-outline" size={40} />
						<Text className="mt-3 font-medium text-foreground">
							No friends yet
						</Text>
						<Text className="mt-1 text-muted text-xs">
							Import your contacts or accept a request to get ringing
						</Text>
					</Surface>
				)}

				{accepted.length > 0 && (
					<View className="gap-2">
						{accepted.map((friendship) => (
							<Surface
								className="rounded-lg p-3"
								key={friendship.friendshipId}
								variant="secondary"
							>
								<View className="flex-row items-center gap-3">
									<Ionicons
										color={accentColor}
										name="person-circle-outline"
										size={36}
									/>
									<View className="flex-1">
										<Text className="font-medium text-foreground text-sm">
											{friendship.friend.name}
										</Text>
										<Text className="text-muted text-xs">
											{friendship.friend.points} points
										</Text>
									</View>
									<Button
										isDisabled={ringMutation.isPending}
										onPress={() => handleRing(friendship.friend.id)}
										size="sm"
									>
										<Button.Label>Ring</Button.Label>
									</Button>
								</View>
							</Surface>
						))}
					</View>
				)}
			</ScrollView>
		</Container>
	);
}

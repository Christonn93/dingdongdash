import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Chip,
	Input,
	Label,
	Spinner,
	Surface,
	TextField,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/contacts";
import { queryClient, trpc } from "@/utils/trpc";

export default function ProfileScreen() {
	const { toast } = useToast();
	const dangerColor = useThemeColor("danger");

	const me = useQuery(trpc.users.me.queryOptions());
	const [ledgerCursor, setLedgerCursor] = useState<string | undefined>();
	const ledger = useQuery(
		trpc.points.getLedger.queryOptions({ cursor: ledgerCursor, limit: 20 })
	);

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	const user = me.data?.user;

	const updateName = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({ label: "Name updated", variant: "success" });
				me.refetch();
			},
		})
	);

	const linkPhone = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({
					label: "Phone linked for contact matching",
					variant: "success",
				});
				setPhone("");
				me.refetch();
			},
		})
	);

	const handleSaveName = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			return;
		}
		updateName.mutate({ name: trimmed });
	};

	const handleLinkPhone = async () => {
		const normalized = normalizePhoneNumber(phone);
		if (normalized.length < 7) {
			toast.show({ label: "Enter a valid phone number", variant: "danger" });
			return;
		}
		const phoneHash = await hashPhoneNumber(normalized);
		linkPhone.mutate({ phoneHash });
	};

	const handleUnlinkPhone = () => {
		linkPhone.mutate({ phoneHash: undefined });
	};

	const handleLoadMore = () => {
		if (ledger.data?.nextCursor) {
			setLedgerCursor(ledger.data.nextCursor);
		}
	};

	const handleSignOut = useCallback(() => {
		authClient.signOut();
		queryClient.clear();
	}, []);

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<Surface className="mb-4 rounded-lg p-4" variant="secondary">
					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<Text className="font-semibold text-foreground text-lg">
								{user?.name ?? "…"}
							</Text>
							<Text className="text-muted text-sm">{user?.email}</Text>
						</View>
						<View className="items-end">
							<Text className="font-bold text-3xl text-foreground">
								{user?.points ?? "…"}
							</Text>
							<Text className="text-muted text-xs">points</Text>
						</View>
					</View>
				</Surface>

				<Surface className="mb-4 rounded-lg p-4" variant="secondary">
					<Text className="mb-3 font-medium text-foreground">Display name</Text>
					<View className="flex-row items-end gap-2">
						<View className="flex-1">
							<TextField>
								<Label>Name</Label>
								<Input
									editable={!updateName.isPending}
									onChangeText={setName}
									onSubmitEditing={handleSaveName}
									placeholder={user?.name}
									returnKeyType="done"
									value={name}
								/>
							</TextField>
						</View>
						<Button
							isDisabled={updateName.isPending || !name.trim()}
							onPress={handleSaveName}
							size="sm"
						>
							<Button.Label>Save</Button.Label>
						</Button>
					</View>
				</Surface>

				<Surface className="mb-4 rounded-lg p-4" variant="secondary">
					<View className="mb-1 flex-row items-center justify-between">
						<Text className="font-medium text-foreground">
							Contact matching
						</Text>
						{user?.phoneHash ? (
							<Chip color="success" size="sm" variant="secondary">
								<Chip.Label>Linked</Chip.Label>
							</Chip>
						) : (
							<Chip color="accent" size="sm" variant="secondary">
								<Chip.Label>Not linked</Chip.Label>
							</Chip>
						)}
					</View>
					<Text className="mb-3 text-muted text-xs">
						Link your number so friends who have you in their contacts can find
						you. Stored as a one-way hash.
					</Text>
					{user?.phoneHash ? (
						<Button
							className="self-start"
							onPress={handleUnlinkPhone}
							variant="secondary"
						>
							<Button.Label>Unlink number</Button.Label>
						</Button>
					) : (
						<View className="flex-row items-end gap-2">
							<View className="flex-1">
								<TextField>
									<Label>Phone number</Label>
									<Input
										editable={!linkPhone.isPending}
										keyboardType="phone-pad"
										onChangeText={setPhone}
										onSubmitEditing={handleLinkPhone}
										placeholder="+1 555 000 1234"
										returnKeyType="done"
										value={phone}
									/>
								</TextField>
							</View>
							<Button
								isDisabled={linkPhone.isPending || !phone.trim()}
								onPress={handleLinkPhone}
								size="sm"
							>
								<Button.Label>Link</Button.Label>
							</Button>
						</View>
					)}
				</Surface>

				<Surface className="mb-4 rounded-lg p-4" variant="secondary">
					<Text className="mb-3 font-medium text-foreground">
						Point history
					</Text>
					{ledger.isLoading ? (
						<View className="items-center py-6">
							<Spinner size="lg" />
						</View>
					) : null}
					{!ledger.isLoading && (ledger.data?.entries.length ?? 0) === 0 && (
						<Text className="text-muted text-sm">No activity yet.</Text>
					)}
					{ledger.data?.entries.map((entry) => (
						<View
							className="flex-row items-center justify-between border-background border-b py-2"
							key={entry.id}
						>
							<View className="flex-1">
								<Text className="text-foreground text-sm capitalize">
									{entry.reason}
								</Text>
								<Text className="text-muted text-xs">
									{new Date(entry.createdAt).toLocaleString()}
								</Text>
							</View>
							<Text
								className={`font-semibold text-sm ${entry.amount >= 0 ? "text-success" : "text-danger"}`}
							>
								{entry.amount >= 0 ? "+" : ""}
								{entry.amount}
							</Text>
						</View>
					))}
					{ledger.data?.nextCursor ? (
						<Button
							className="mt-3 self-center"
							onPress={handleLoadMore}
							variant="secondary"
						>
							<Button.Label>Load more</Button.Label>
						</Button>
					) : null}
				</Surface>

				<Surface className="rounded-lg p-4" variant="secondary">
					<Button className="w-full" onPress={handleSignOut} variant="ghost">
						<Ionicons color={dangerColor} name="log-out-outline" size={18} />
						<Button.Label>Sign Out</Button.Label>
					</Button>
				</Surface>
			</ScrollView>
		</Container>
	);
}

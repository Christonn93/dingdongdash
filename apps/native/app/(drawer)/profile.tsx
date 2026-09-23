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
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { PointsBadge } from "@/components/door/points-badge";
import { ErrorState } from "@/components/game/screen-states";
import { authClient } from "@/lib/auth-client";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/contacts";
import { rankForPoints } from "@/lib/game";
import { queryClient, trpc } from "@/utils/trpc";

export default function ProfileScreen() {
	const { toast } = useToast();
	const dangerColor = useThemeColor("danger");
	const accentColor = useThemeColor("accent");
	const successColor = useThemeColor("success");

	const me = useQuery(trpc.users.me.queryOptions());
	const stats = useQuery(trpc.points.getStats.queryOptions());
	const [ledgerCursor, setLedgerCursor] = useState<string | undefined>();
	const ledger = useQuery(
		trpc.points.getLedger.queryOptions({ cursor: ledgerCursor, limit: 20 })
	);

	const previousPoints = useRef<number | null>(null);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	const user = me.data?.user;
	const points = user?.points ?? 1000;
	const delta =
		previousPoints.current === null ? null : points - previousPoints.current;
	if (user && previousPoints.current !== user.points) {
		previousPoints.current = user.points;
	}

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

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);

	const handleChangePassword = async () => {
		if (newPassword.length < 8) {
			toast.show({
				label: "New password must be at least 8 characters",
				variant: "danger",
			});
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.show({ label: "Passwords don't match", variant: "danger" });
			return;
		}
		setChangingPassword(true);
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (error) {
				toast.show({
					label: error.message ?? "Could not update your password",
					variant: "danger",
				});
				return;
			}
			toast.show({ label: "Password updated", variant: "success" });
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} finally {
			setChangingPassword(false);
		}
	};

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View
					style={{
						backgroundColor: accentColor,
						borderRadius: 24,
						boxShadow: "0 10px 30px rgba(249,115,22,0.35)",
						marginBottom: 16,
						padding: 18,
					}}
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1">
							<Text className="font-extrabold text-white text-xl">
								{user?.name ?? "…"}
							</Text>
							<Text className="mt-0.5 text-sm text-white/80">
								{user?.email}
							</Text>
							<View
								style={{
									alignSelf: "flex-start",
									backgroundColor: "rgba(255,255,255,0.18)",
									borderColor: "rgba(255,255,255,0.35)",
									borderRadius: 999,
									borderWidth: 1,
									marginTop: 8,
									paddingHorizontal: 10,
									paddingVertical: 4,
								}}
							>
								<Text className="font-bold text-white text-xs">
									{rankForPoints(points).emoji} {rankForPoints(points).title}
								</Text>
							</View>
						</View>
						<PointsBadge
							delta={delta}
							deltaKey={points}
							points={points}
							size="md"
						/>
					</View>
				</View>

				<Surface className="mb-4 rounded-2xl p-4" variant="secondary">
					<Text className="mb-3 font-semibold text-foreground">Stats</Text>
					{stats.isLoading ? (
						<View className="items-center py-4">
							<Spinner size="sm" />
						</View>
					) : null}
					{stats.data ? (
						<View className="flex-row">
							<StatBox
								color={successColor}
								icon="checkmark-circle"
								label="Catches"
								value={stats.data.catches}
							/>
							<StatBox
								color={dangerColor}
								icon="close-circle"
								label="Ditched"
								value={stats.data.ditches}
							/>
							<StatBox
								color="#f5b301"
								icon="flame"
								label="Best streak"
								value={stats.data.bestStreak}
							/>
						</View>
					) : null}
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
					<Text className="mb-1 font-medium text-foreground">Password</Text>
					<Text className="mb-3 text-muted text-xs">
						Update your password. Other signed-in devices will be signed out.
					</Text>
					<View className="gap-3">
						<TextField>
							<Label>Current password</Label>
							<Input
								autoComplete="password"
								onChangeText={setCurrentPassword}
								placeholder="Current password"
								secureTextEntry
								textContentType="password"
								value={currentPassword}
							/>
						</TextField>
						<TextField>
							<Label>New password</Label>
							<Input
								autoComplete="new-password"
								onChangeText={setNewPassword}
								placeholder="At least 8 characters"
								secureTextEntry
								textContentType="newPassword"
								value={newPassword}
							/>
						</TextField>
						<TextField>
							<Label>Confirm new password</Label>
							<Input
								autoComplete="new-password"
								onChangeText={setConfirmPassword}
								placeholder="Repeat new password"
								secureTextEntry
								textContentType="newPassword"
								value={confirmPassword}
							/>
						</TextField>
						<Button
							isDisabled={
								changingPassword ||
								!currentPassword ||
								!newPassword ||
								!confirmPassword
							}
							onPress={handleChangePassword}
						>
							{changingPassword ? (
								<Spinner color="default" size="sm" />
							) : (
								<Button.Label>Update password</Button.Label>
							)}
						</Button>
					</View>
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
					{ledger.isError ? (
						<ErrorState
							message="We couldn't load your point history."
							onRetry={() => ledger.refetch()}
						/>
					) : null}
					{!ledger.isLoading && (ledger.data?.entries.length ?? 0) === 0 && (
						<Text className="text-muted text-sm">No activity yet.</Text>
					)}
					{ledger.data?.entries.map((entry) => {
						const isPositive = entry.amount >= 0;
						const tone = isPositive ? successColor : dangerColor;
						return (
							<View
								className="flex-row items-center justify-between border-background border-b py-2"
								key={entry.id}
							>
								<View className="flex-1 flex-row items-center gap-3">
									<View
										style={{
											alignItems: "center",
											backgroundColor: `${tone}22`,
											borderRadius: 15,
											height: 30,
											justifyContent: "center",
											width: 30,
										}}
									>
										<Ionicons
											color={tone}
											name={reasonIcon(entry.reason)}
											size={16}
										/>
									</View>
									<View>
										<Text className="text-foreground text-sm capitalize">
											{reasonLabel(entry.reason)}
										</Text>
										<Text className="text-muted text-xs">
											{new Date(entry.createdAt).toLocaleString()}
										</Text>
									</View>
								</View>
								<Text className="font-bold text-sm" style={{ color: tone }}>
									{isPositive ? "+" : ""}
									{entry.amount}
								</Text>
							</View>
						);
					})}
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

const REASON_META: Record<
	string,
	{ icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }
> = {
	adjustment: { icon: "swap-horizontal", label: "Adjustment" },
	catch: { icon: "checkmark-circle", label: "Catch" },
	daily_bonus: { icon: "gift", label: "Daily bonus" },
	ditch_penalty: { icon: "close-circle", label: "Ditched" },
	ditch_reward: { icon: "trophy-outline", label: "Caught them" },
	ditch_ring_penalty: { icon: "log-out-outline", label: "Ringer ditched" },
	purchase: { icon: "cart-outline", label: "Purchase" },
	signup_bonus: { icon: "gift-outline", label: "Welcome bonus" },
};

function reasonIcon(
	reason: string
): React.ComponentProps<typeof Ionicons>["name"] {
	return REASON_META[reason]?.icon ?? "ellipsis-horizontal-circle";
}

function reasonLabel(reason: string): string {
	return REASON_META[reason]?.label ?? reason.replaceAll("_", " ");
}

function StatBox({
	color,
	icon,
	label,
	value,
}: {
	color: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
	value: number;
}) {
	return (
		<View className="flex-1 items-center">
			<View
				style={{
					alignItems: "center",
					backgroundColor: `${color}22`,
					borderRadius: 18,
					height: 36,
					justifyContent: "center",
					marginBottom: 6,
					width: 36,
				}}
			>
				<Ionicons color={color} name={icon} size={20} />
			</View>
			<Text className="font-black text-foreground text-xl">{value}</Text>
			<Text className="text-muted text-xs">{label}</Text>
		</View>
	);
}

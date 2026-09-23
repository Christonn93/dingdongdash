import {
	DOOR_SKINS,
	type DoorSkinTheme,
} from "@dingdongdash/api/lib/door-catalog";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColor, useToast } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
	FadeInDown,
	FadeInUp,
	Layout,
	ZoomIn,
} from "react-native-reanimated";
import { Container } from "@/components/container";
import { ConfettiBurst } from "@/components/door/confetti";
import { DoorScene } from "@/components/door/door";
import { DoorbellButton } from "@/components/door/doorbell-button";
import { PointsBadge } from "@/components/door/points-badge";
import { DailyBonusCard } from "@/components/game/daily-bonus-card";
import { DingDongStamp } from "@/components/game/ding-dong-stamp";
import { Fireflies } from "@/components/game/fireflies";
import { HowToPlay } from "@/components/game/how-to-play";
import { ShakeView } from "@/components/game/shake";
import { useCatchStreak } from "@/hooks/use-catch-streak";
import { authClient } from "@/lib/auth-client";
import { type Rank, rankForPoints } from "@/lib/game";
import { playSound } from "@/lib/sound";
import { trpc } from "@/utils/trpc";

interface IncomingRing {
	durationMs: number;
	expiresAt: string;
	id: string;
	ringer: { name: string } | null;
}

interface FriendRow {
	friend: { id: string; name: string; points: number };
	friendshipId: string;
}

interface HomeColors {
	accent: string;
	border: string;
	foreground: string;
	muted: string;
	surface: string;
}

export default function Dashboard() {
	const { toast } = useToast();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const authed = !!session?.user;
	const user = session?.user;

	const me = useQuery(
		trpc.users.me.queryOptions(undefined, { enabled: authed })
	);
	const skin =
		DOOR_SKINS.find((item) => item.id === me.data?.user.doorSkinId) ??
		DOOR_SKINS[0];
	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, {
			enabled: authed,
			refetchInterval: 3000,
		})
	);
	const friends = useQuery(
		trpc.friends.list.queryOptions(undefined, { enabled: authed })
	);

	const [ringPanelOpen, setRingPanelOpen] = useState(false);
	const [burstId, setBurstId] = useState(0);
	const [stampVisible, setStampVisible] = useState(false);
	const [bonusDismissed, setBonusDismissed] = useState(false);
	const previousPoints = useRef(me.data?.user.points);

	// Signed-out visitors are sent back to the doorstep / sign-in.
	useEffect(() => {
		if (!(sessionPending || authed)) {
			router.replace("/");
		}
	}, [authed, sessionPending]);

	const points = me.data?.user.points ?? 1000;
	const friendCount = me.data?.friendCount ?? 0;
	const delta = points - (previousPoints.current ?? points);
	if (previousPoints.current !== points) {
		previousPoints.current = points;
	}

	const { streak } = useCatchStreak();
	const rank = rankForPoints(points);

	const dailyBonus = useQuery(trpc.points.getDailyBonusStatus.queryOptions());
	const claimBonus = useMutation(
		trpc.points.claimDailyBonus.mutationOptions({
			onSuccess: (result) => {
				if (!result.granted) {
					return;
				}
				playSound(result.milestone ? "fanfare" : "chime");
				setBurstId((n) => n + 1);
				setBonusDismissed(true);
				me.refetch();
				dailyBonus.refetch();
				toast.show({
					label: result.milestone
						? `🔥 ${result.streak}-day streak! +${result.points} points`
						: `Daily bonus claimed! +${result.points} points`,
					variant: "success",
				});
			},
		})
	);

	const incoming = active.data?.rings[0];
	const ringing = !!incoming;

	const colors: HomeColors = {
		accent: useThemeColor("accent"),
		border: useThemeColor("border"),
		foreground: useThemeColor("foreground"),
		muted: useThemeColor("muted"),
		surface: useThemeColor("surface"),
	};

	const firstName = user?.name?.split(" ")[0] ?? "friend";

	const ringMutation = useMutation(
		trpc.rings.create.mutationOptions({
			onSuccess: () => {
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success
				).catch(() => undefined);
				playSound("chime");
				setRingPanelOpen(false);
				setBurstId((n) => n + 1);
				setStampVisible(true);
				setTimeout(() => setStampVisible(false), 1400);
			},
		})
	);

	const openDoor = useCallback(() => {
		if (!incoming) {
			return;
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
			() => undefined
		);
		router.push(`/ring/${incoming.id}`);
	}, [incoming]);

	const handleDoorbell = useCallback(() => {
		if (ringing) {
			openDoor();
			return;
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
			() => undefined
		);
		setRingPanelOpen((open) => !open);
	}, [openDoor, ringing]);

	const ringFriend = useCallback(
		(targetUserId: string) => ringMutation.mutate({ targetUserId }),
		[ringMutation]
	);

	const accepted = friends.data?.accepted ?? [];
	const pendingCount =
		(friends.data?.incoming.length ?? 0) + (friends.data?.outgoing.length ?? 0);

	return (
		<Container>
			<View className="p-4">
				{dailyBonus.data?.available && !bonusDismissed ? (
					<DailyBonusCard
						claiming={claimBonus.isPending}
						onClaim={() => claimBonus.mutate()}
						onDismiss={() => setBonusDismissed(true)}
						points={dailyBonus.data.points}
						streak={dailyBonus.data.streak}
					/>
				) : null}

				{me.isError ? (
					<View
						style={{
							alignItems: "center",
							backgroundColor: `${colors.foreground}12`,
							borderColor: colors.border,
							borderRadius: 16,
							borderWidth: 1,
							flexDirection: "row",
							gap: 10,
							marginBottom: 12,
							padding: 12,
						}}
					>
						<Ionicons
							color={colors.foreground}
							name="cloud-offline-outline"
							size={18}
						/>
						<Text
							className="flex-1 font-medium text-xs"
							style={{ color: colors.muted }}
						>
							Can't reach the doorbell server.
						</Text>
						<Pressable hitSlop={10} onPress={() => me.refetch()}>
							<Text
								className="font-bold text-xs"
								style={{ color: colors.accent }}
							>
								Retry
							</Text>
						</Pressable>
					</View>
				) : null}

				<HeroHeader
					colors={colors}
					delta={delta}
					firstName={firstName}
					friendCount={friendCount}
					loginStreak={dailyBonus.data?.streak ?? 0}
					pendingCount={pendingCount}
					points={points}
					rank={rank}
					streak={streak}
				/>

				<ShakeView intensity={5} shakeKey={burstId > 0 ? burstId : null}>
					<DoorCard
						cameraDoorbell={me.data?.user.cameraDoorbell ?? false}
						colors={colors}
						countdownFraction={
							incoming
								? Math.max(
										0,
										(new Date(incoming.expiresAt).getTime() - Date.now()) /
											incoming.durationMs
									)
								: 1
						}
						incoming={incoming}
						loading={ringMutation.isPending}
						onOpen={openDoor}
						onRing={handleDoorbell}
						ringing={ringing}
						skin={skin.theme}
						spyCamera={me.data?.user.spyCamera ?? false}
					/>
				</ShakeView>

				{stampVisible ? (
					<View
						className="absolute inset-0 items-center justify-center"
						style={{ pointerEvents: "none" }}
					>
						<DingDongStamp triggerKey={burstId} />
					</View>
				) : null}

				{burstId > 0 ? (
					<View
						className="absolute inset-0 items-center"
						style={{ pointerEvents: "none" }}
					>
						<ConfettiBurst key={burstId} />
					</View>
				) : null}

				<FriendPickerPanel
					accepted={accepted}
					colors={colors}
					loading={ringMutation.isPending}
					onClose={() => setRingPanelOpen(false)}
					onRing={ringFriend}
					open={ringPanelOpen}
				/>

				<HowToPlay
					accent={colors.accent}
					border={colors.border}
					foreground={colors.foreground}
					muted={colors.muted}
					surface={colors.surface}
				/>

				<View className="items-center py-6">
					<View className="flex-row items-center gap-1.5">
						<Ionicons
							color={colors.muted}
							name="shield-checkmark-outline"
							size={14}
						/>
						<Text className="text-xs" style={{ color: colors.muted }}>
							Mutual friends only · one ring at a time · DND respected
						</Text>
					</View>
				</View>
			</View>
		</Container>
	);
}

function HeroHeader({
	colors,
	firstName,
	points,
	delta,
	friendCount,
	pendingCount,
	rank,
	streak,
	loginStreak,
}: {
	colors: HomeColors;
	firstName: string;
	points: number;
	delta: number;
	friendCount: number;
	pendingCount: number;
	rank: Rank;
	streak: number;
	loginStreak: number;
}) {
	return (
		<Animated.View entering={FadeInDown.duration(350)}>
			<View
				style={{
					backgroundColor: colors.accent,
					borderRadius: 24,
					boxShadow: "0 10px 30px rgba(249,115,22,0.35)",
					padding: 18,
				}}
			>
				<View className="flex-row items-center justify-between">
					<View>
						<Text className="font-semibold text-sm text-white/80">
							Hey {firstName},
						</Text>
						<Text className="mt-0.5 font-extrabold text-lg text-white">
							Welcome to your doorstep
						</Text>
					</View>
					<PointsBadge
						delta={delta === 0 ? null : delta}
						deltaKey={points}
						points={points}
						size="md"
					/>
				</View>

				<View className="mt-3 flex-row flex-wrap gap-2">
					<Pill label={`${friendCount} friends`} />
					<Pill label={`${rank.emoji} ${rank.title}`} />
					{streak >= 2 ? (
						<Pill highlight label={`🔥 ${streak}x streak`} />
					) : null}
					{loginStreak >= 2 ? (
						<Pill highlight label={`📅 ${loginStreak}-day login`} />
					) : null}
					{pendingCount > 0 ? (
						<Pill highlight label={`${pendingCount} pending`} />
					) : null}
				</View>
			</View>
		</Animated.View>
	);
}

function DoorCard({
	colors,
	incoming,
	ringing,
	countdownFraction,
	loading,
	cameraDoorbell,
	skin,
	spyCamera,
	onOpen,
	onRing,
}: {
	colors: HomeColors;
	incoming?: IncomingRing;
	ringing: boolean;
	countdownFraction: number;
	loading: boolean;
	cameraDoorbell: boolean;
	skin: DoorSkinTheme;
	spyCamera: boolean;
	onOpen: () => void;
	onRing: () => void;
}) {
	return (
		<View className="mt-4">
			<Animated.View
				entering={FadeInUp.duration(400)}
				style={{
					alignItems: "center",
					backgroundColor: colors.surface,
					borderColor: colors.border,
					borderRadius: 28,
					borderWidth: 1,
					boxShadow: "0 18px 40px rgba(15,10,40,0.25)",
					overflow: "hidden",
					padding: 14,
					position: "relative",
				}}
			>
				<Fireflies />
				<DoorScene
					cameraDoorbell={cameraDoorbell}
					countdownFraction={countdownFraction}
					disabled={loading}
					onOpen={onOpen}
					onRing={onRing}
					phase={ringing ? "ringing" : "idle"}
					size={300}
					skin={skin}
					spyCamera={spyCamera}
				/>

				<View className="mt-3 w-full items-center">
					{ringing && incoming ? (
						<Animated.View
							className="w-full items-center"
							entering={ZoomIn.springify().damping(12)}
						>
							<Text
								className="text-center font-extrabold text-lg"
								style={{ color: colors.foreground }}
							>
								{incoming.ringer?.name ?? "Someone"} is at your door!
							</Text>
							<Text
								className="mt-0.5 mb-3 text-center text-sm"
								style={{ color: colors.muted }}
							>
								Open the door before the timer runs out.
							</Text>
							<DoorbellButton
								icon="bell-ringing"
								label="Open the door"
								onPress={onOpen}
								size="lg"
							/>
						</Animated.View>
					) : (
						<>
							<Text
								className="text-center font-bold text-base"
								style={{ color: colors.foreground }}
							>
								Who's brave enough to ring?
							</Text>
							<Text
								className="mt-0.5 mb-3 text-center text-sm"
								style={{ color: colors.muted }}
							>
								Tap the doorbell to ring a friend.
							</Text>
							<DoorbellButton
								icon="bell"
								label="Ring a friend"
								onPress={onRing}
								size="lg"
							/>
						</>
					)}
				</View>
			</Animated.View>
		</View>
	);
}

function FriendPickerPanel({
	open,
	accepted,
	loading,
	colors,
	onRing,
	onClose,
}: {
	open: boolean;
	accepted: FriendRow[];
	loading: boolean;
	colors: HomeColors;
	onRing: (targetUserId: string) => void;
	onClose: () => void;
}) {
	if (!open) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeInUp.springify().damping(16)}
			exiting={FadeInDown.duration(150)}
			layout={Layout}
			style={{
				backgroundColor: colors.surface,
				borderColor: colors.border,
				borderRadius: 20,
				borderWidth: 1,
				marginTop: 12,
				padding: 12,
			}}
		>
			<View className="mb-2 flex-row items-center justify-between px-1">
				<Text
					className="font-extrabold text-base"
					style={{ color: colors.foreground }}
				>
					Ring a friend
				</Text>
				<Pressable hitSlop={10} onPress={onClose}>
					<Ionicons color={colors.muted} name="close" size={20} />
				</Pressable>
			</View>

			{accepted.length === 0 ? (
				<View className="items-center py-6">
					<Ionicons color={colors.muted} name="people-outline" size={32} />
					<Text
						className="mt-2 text-center text-sm"
						style={{ color: colors.muted }}
					>
						No friends to ring yet. Add some in the Friends tab.
					</Text>
					<Pressable className="mt-3" onPress={() => router.push("/friends")}>
						<Text
							className="font-bold text-sm"
							style={{ color: colors.accent }}
						>
							Go to Friends →
						</Text>
					</Pressable>
				</View>
			) : (
				<View>
					{accepted.map((friendship) => (
						<FriendRingRow
							key={friendship.friendshipId}
							loading={loading}
							name={friendship.friend.name}
							onRing={() => onRing(friendship.friend.id)}
							points={friendship.friend.points}
						/>
					))}
				</View>
			)}
		</Animated.View>
	);
}

function Pill({
	label,
	highlight = false,
}: {
	label: string;
	highlight?: boolean;
}) {
	return (
		<View
			style={{
				backgroundColor: highlight
					? "rgba(255,255,255,0.92)"
					: "rgba(255,255,255,0.18)",
				borderColor: "rgba(255,255,255,0.35)",
				borderRadius: 999,
				borderWidth: 1,
				paddingHorizontal: 10,
				paddingVertical: 4,
			}}
		>
			<Text
				className="font-bold text-xs"
				style={{ color: highlight ? "#7c2d12" : "#fff" }}
			>
				{label}
			</Text>
		</View>
	);
}

function FriendRingRow({
	name,
	points,
	onRing,
	loading,
}: {
	name: string;
	points: number;
	onRing: () => void;
	loading: boolean;
}) {
	const accentColor = useThemeColor("accent");
	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");
	const initial = name.trim().charAt(0).toUpperCase() || "?";

	return (
		<Pressable
			disabled={loading}
			onPress={onRing}
			style={({ pressed }) => ({
				alignItems: "center",
				borderRadius: 14,
				flexDirection: "row",
				gap: 12,
				opacity: pressed ? 0.7 : 1,
				paddingHorizontal: 8,
				paddingVertical: 10,
				transform: [{ scale: pressed ? 0.98 : 1 }],
			})}
		>
			<View
				style={{
					alignItems: "center",
					backgroundColor: accentColor,
					borderRadius: 20,
					height: 40,
					justifyContent: "center",
					width: 40,
				}}
			>
				<Text className="font-extrabold text-base text-white">{initial}</Text>
			</View>
			<View className="flex-1">
				<Text className="font-bold text-sm" style={{ color: foregroundColor }}>
					{name}
				</Text>
				<Text className="text-xs" style={{ color: mutedColor }}>
					{points.toLocaleString()} pts
				</Text>
			</View>
			<View
				style={{
					alignItems: "center",
					backgroundColor: "rgba(249,115,22,0.12)",
					borderRadius: 999,
					flexDirection: "row",
					gap: 4,
					paddingHorizontal: 12,
					paddingVertical: 7,
				}}
			>
				<Ionicons color={accentColor} name="notifications-outline" size={15} />
				<Text className="font-bold text-xs" style={{ color: accentColor }}>
					Ring
				</Text>
			</View>
		</Pressable>
	);
}

import { DOOR_SKINS } from "@dingdongdash/api/lib/door-catalog";
import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { Skeleton } from "@dingdongdash/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/animated-number";
import { DoorThumb } from "@/components/door/door-thumb";
import { HousePreview } from "@/components/door/house-preview";
import { Reveal } from "@/components/reveal";
import { playSoundById } from "@/lib/audio";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/house")({
	component: HouseRoute,
});

function HouseRoute() {
	const catalog = useQuery(trpc.doors.getCatalog.queryOptions());
	const me = useQuery(trpc.users.me.queryOptions());
	const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);

	const buyDoor = useMutation(
		trpc.doors.buyDoor.mutationOptions({
			onSuccess: () => {
				toast.success("Door added to your collection!");
				catalog.refetch();
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);
	const equipDoor = useMutation(
		trpc.doors.equipDoor.mutationOptions({
			onSuccess: () => {
				toast.success("Door equipped — your house has a new look!");
				catalog.refetch();
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);
	const buyUpgrade = useMutation(
		trpc.doors.buyUpgrade.mutationOptions({
			onSuccess: () => {
				toast.success("Camera doorbell installed — you'll see who's ringing!");
				catalog.refetch();
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);
	const buySound = useMutation(
		trpc.doors.buySound.mutationOptions({
			onSuccess: () => {
				toast.success("Sound added to your collection!");
				catalog.refetch();
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);
	const equipSound = useMutation(
		trpc.doors.equipSound.mutationOptions({
			onSuccess: () => {
				toast.success("Sound equipped — that's what ringers will hear!");
				catalog.refetch();
				me.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const equippedId = catalog.data?.doorSkinId ?? "classic";
	const equipped =
		DOOR_SKINS.find((skin) => skin.id === equippedId) ?? DOOR_SKINS[0];
	const preview =
		DOOR_SKINS.find((skin) => skin.id === (previewSkinId ?? equippedId)) ??
		DOOR_SKINS[0];
	const points = me.data?.user.points ?? 0;

	const handleDoor = useCallback(
		(skinId: string, owned: boolean) => {
			if (owned) {
				equipDoor.mutate({ doorSkinId: skinId });
			} else {
				buyDoor.mutate({ doorSkinId: skinId });
			}
		},
		[buyDoor, equipDoor]
	);

	const handleUpgrade = useCallback(
		(upgradeId: "spy_camera" | "camera_doorbell") => {
			buyUpgrade.mutate({ upgradeId });
		},
		[buyUpgrade]
	);

	const handleSound = useCallback(
		(soundId: string, owned: boolean) => {
			if (owned) {
				equipSound.mutate({ soundId });
			} else {
				buySound.mutate({ soundId });
			}
		},
		[buySound, equipSound]
	);

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6 flex items-end justify-between gap-4">
					<div>
						<h1 className="font-display font-extrabold text-2xl tracking-tight">
							My House
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Your door, your wall, your style. Spend points to dress it up.
						</p>
					</div>
					<p className="shrink-0 text-right text-muted-foreground text-sm">
						<span className="font-semibold text-foreground">
							<AnimatedNumber value={points} />
						</span>{" "}
						pts
					</p>
				</div>
			</Reveal>

			<Reveal index={1}>
				<div className="relative">
					<HousePreview
						cameraDoorbell={catalog.data?.cameraDoorbell ?? false}
						label={me.data?.user.username ?? "17"}
						spyCamera={catalog.data?.spyCamera ?? false}
						theme={preview.theme}
					/>
					{preview.id === equipped.id ? null : (
						<span className="absolute top-3 left-3 rounded-full bg-black/45 px-3 py-1 font-semibold text-amber-100 text-xs backdrop-blur">
							Previewing “{preview.name}”
						</span>
					)}
				</div>
			</Reveal>

			{catalog.isLoading ? <Skeleton className="mt-6 h-32 w-full" /> : null}

			{catalog.data ? (
				<>
					<Reveal index={2}>
						<div className="mt-8">
							<h2 className="mb-1 font-display font-extrabold text-lg">
								Doors
							</h2>
							<p className="mb-4 text-muted-foreground text-sm">
								Each door brings its own wall and its own way to announce you.
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{catalog.data.skins.map((skin, index) => {
									const theme = DOOR_SKINS.find((s) => s.id === skin.id)?.theme;
									if (!theme) {
										return null;
									}
									return (
										<Reveal index={index} key={skin.id}>
											<DoorSkinCard
												busy={buyDoor.isPending || equipDoor.isPending}
												cameraDoorbell={catalog.data?.cameraDoorbell ?? false}
												canAfford={points >= skin.pricePoints}
												description={skin.description}
												equipped={skin.equipped}
												onAction={() => handleDoor(skin.id, skin.owned)}
												onPreview={() => setPreviewSkinId(skin.id)}
												owned={skin.owned}
												previewing={preview.id === skin.id}
												pricePoints={skin.pricePoints}
												skinId={skin.id}
												theme={theme}
												title={skin.name}
											/>
										</Reveal>
									);
								})}
							</div>
						</div>
					</Reveal>

					<Reveal index={3}>
						<div className="mt-8">
							<h2 className="mb-1 font-display font-extrabold text-lg">
								Upgrades
							</h2>
							<p className="mb-4 text-muted-foreground text-sm">
								A camera doorbell reveals who's ringing. Without one, ringers
								stay a mystery.
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{catalog.data.upgrades.map((upgrade, index) => (
									<Reveal index={index} key={upgrade.id}>
										<UpgradeCard
											busy={buyUpgrade.isPending}
											canAfford={points >= upgrade.pricePoints}
											description={upgrade.description}
											installed={upgrade.owned}
											onInstall={() => handleUpgrade(upgrade.id)}
											pricePoints={upgrade.pricePoints}
											title={upgrade.name}
										/>
									</Reveal>
								))}
							</div>
						</div>
					</Reveal>

					<Reveal index={4}>
						<div className="mt-8">
							<h2 className="mb-1 font-display font-extrabold text-lg">
								Ring sounds
							</h2>
							<p className="mb-4 text-muted-foreground text-sm">
								This is what ringers hear when they knock on your door. Preview
								them all, then pick a favourite.
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{catalog.data.sounds.map((sound, index) => (
									<Reveal index={index} key={sound.id}>
										<SoundCard
											busy={buySound.isPending || equipSound.isPending}
											canAfford={points >= sound.pricePoints}
											description={sound.description}
											equipped={sound.equipped}
											onAction={() => handleSound(sound.id, sound.owned)}
											owned={sound.owned}
											pricePoints={sound.pricePoints}
											soundId={sound.id}
											title={sound.name}
										/>
									</Reveal>
								))}
							</div>
						</div>
					</Reveal>
				</>
			) : null}
		</div>
	);
}

function DoorSkinCard({
	title,
	description,
	pricePoints,
	owned,
	equipped,
	previewing,
	canAfford,
	busy,
	theme,
	cameraDoorbell,
	skinId,
	onAction,
	onPreview,
}: {
	title: string;
	description: string;
	pricePoints: number;
	owned: boolean;
	equipped: boolean;
	previewing: boolean;
	canAfford: boolean;
	busy: boolean;
	theme: (typeof DOOR_SKINS)[number]["theme"];
	cameraDoorbell: boolean;
	skinId: string;
	onAction: () => void;
	onPreview: () => void;
}) {
	let actionLabel = `${pricePoints} pts`;
	if (equipped) {
		actionLabel = "On your house";
	} else if (owned) {
		actionLabel = "Equip this door";
	}

	return (
		<Card
			className={`overflow-hidden ${previewing ? "ring-2 ring-primary" : ""}`}
		>
			<DoorThumb
				cameraDoorbell={cameraDoorbell}
				label={`Preview the ${title} door`}
				onRing={onPreview}
				skinId={skinId}
				theme={theme}
			/>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-base">
					{title}
					{equipped ? (
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
							Equipped
						</span>
					) : null}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					className="w-full rounded-full"
					disabled={busy || equipped}
					onClick={onAction}
					variant={owned ? "outline" : "default"}
				>
					{actionLabel}
				</Button>
				{owned || canAfford ? null : (
					<p className="mt-2 text-center text-destructive text-xs">
						Not enough points yet
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function UpgradeCard({
	title,
	description,
	pricePoints,
	installed,
	canAfford,
	busy,
	onInstall,
}: {
	title: string;
	description: string;
	pricePoints: number;
	installed: boolean;
	canAfford: boolean;
	busy: boolean;
	onInstall: () => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-base">
					{title}
					{installed ? (
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
							Installed
						</span>
					) : null}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					className="w-full rounded-full"
					disabled={busy || installed}
					onClick={onInstall}
				>
					{installed ? "On your house" : `${pricePoints} pts`}
				</Button>
				{installed || canAfford ? null : (
					<p className="mt-2 text-center text-destructive text-xs">
						Not enough points yet
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function SoundCard({
	title,
	description,
	pricePoints,
	owned,
	equipped,
	canAfford,
	busy,
	soundId,
	onAction,
}: {
	title: string;
	description: string;
	pricePoints: number;
	owned: boolean;
	equipped: boolean;
	canAfford: boolean;
	busy: boolean;
	soundId: string;
	onAction: () => void;
}) {
	let actionLabel = `${pricePoints} pts`;
	if (equipped) {
		actionLabel = "Your sound";
	} else if (owned) {
		actionLabel = "Equip this sound";
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-base">
					<span className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3a2a1a] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
						>
							<span className="h-2 w-2 rounded-full bg-red-500" />
						</span>
						{title}
					</span>
					{equipped ? (
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
							Equipped
						</span>
					) : null}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<Button
					className="w-full rounded-full"
					onClick={() => playSoundById(soundId)}
					variant="outline"
				>
					▶ Preview
				</Button>
				<Button
					className="w-full rounded-full"
					disabled={busy || equipped}
					onClick={onAction}
					variant={owned ? "outline" : "default"}
				>
					{actionLabel}
				</Button>
				{owned || canAfford ? null : (
					<p className="mt-1 text-center text-destructive text-xs">
						Not enough points yet
					</p>
				)}
			</CardContent>
		</Card>
	);
}

import { DOOR_SKINS } from "@dingdongdash/api/lib/door-catalog";
import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { AuthPanel } from "@/components/auth-panel";
import { DoorArt } from "@/components/door/door-art";
import { HouseBell } from "@/components/door/house-backdrop";
import { FrontDoor } from "@/components/front-door";
import { InstallAppButton } from "@/components/install-app-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Reveal } from "@/components/reveal";
import { playDingDong, playSparkle, playThud } from "@/lib/audio";
import { authClient } from "@/lib/auth-client";
import { celebrate } from "@/lib/confetti";
import { spring } from "@/lib/motion";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

type Phase = "idle" | "opening" | "checking" | "reveal";

function LandingPage() {
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();
	const [phase, setPhase] = useState<Phase>("idle");

	const open = phase !== "idle";

	const handleOpen = () => {
		if (phase !== "idle") {
			return;
		}
		playDingDong();
		setPhase("opening");
		window.setTimeout(() => {
			playThud();
			setPhase("checking");
			window.setTimeout(() => {
				if (session?.user) {
					celebrate({ originX: 0.5, originY: 0.45, particleCount: 180 });
					playSparkle();
					navigate({ to: "/dashboard" });
				} else {
					setPhase("reveal");
				}
			}, 600);
		}, 900);
	};

	const hint = getHint(phase);

	return (
		<div className="min-h-full overflow-x-hidden">
			<section className="relative flex min-h-svh flex-col overflow-hidden">
				<FrontDoor hint={hint} label="17" onOpen={handleOpen} open={open} />

				{/* Top bar */}
				<div className="absolute inset-x-0 top-0 z-30">
					<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
						<div className="flex items-center gap-2 text-amber-50">
							<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 shadow-indigo-950/40 shadow-lg">
								<svg
									aria-hidden="true"
									className="h-5 w-5 text-white"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
								</svg>
							</span>
							<span className="font-display font-extrabold text-lg tracking-tight">
								DingDongDitch
							</span>
						</div>
						<div className="flex items-center gap-2">
							{session?.user ? (
								<Button
									className="rounded-full bg-amber-50/15 text-amber-50 backdrop-blur hover:bg-amber-50/25"
									onClick={() => navigate({ to: "/dashboard" })}
									size="sm"
								>
									Go to dashboard
								</Button>
							) : null}
							<InstallAppButton />
							<ModeToggle />
						</div>
					</div>
				</div>

				{/* Title */}
				<AnimatePresence mode="wait">
					{phase === "idle" && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="absolute inset-x-0 top-16 z-20 px-6 text-center"
							exit={{ opacity: 0, y: -12 }}
							initial={{ opacity: 0, y: -12 }}
							key="title"
							transition={spring}
						>
							<span className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-black/25 px-3 py-1 font-semibold text-amber-100 text-xs backdrop-blur">
								Real-time social showdown
							</span>
							<h1 className="mx-auto mt-4 max-w-2xl font-display font-extrabold text-4xl text-amber-50 drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] sm:text-6xl">
								Ring the doorbell.{" "}
								<span className="bg-linear-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
									Beat the clock.
								</span>
							</h1>
							<p className="mx-auto mt-4 max-w-md text-amber-100/85 text-sm drop-shadow sm:text-base">
								Ding a friend, they have 30 seconds to answer the door. Catch
								them, or they ditch you.
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Checking chip */}
				<AnimatePresence>
					{phase === "checking" && (
						<motion.div
							animate={{ opacity: 1, scale: 1 }}
							className="absolute inset-x-0 top-1/2 z-30 flex justify-center"
							exit={{ opacity: 0, scale: 0.9 }}
							initial={{ opacity: 0, scale: 0.9 }}
							key="checking"
							transition={spring}
						>
							<div className="flex items-center gap-2 rounded-full border border-amber-200/30 bg-black/40 px-5 py-2.5 font-medium text-amber-50 text-sm backdrop-blur">
								<svg
									className="h-4 w-4 animate-spin text-amber-200"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									viewBox="0 0 24 24"
								>
									<title>Loading</title>
									<path
										d="M12 3a9 9 0 109 9"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								Checking who's home…
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Login / sign-up reveal */}
				<AnimatePresence>
					{phase === "reveal" && (
						<motion.div
							animate={{ opacity: 1 }}
							className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="auth"
						>
							<AuthPanel onBack={() => setPhase("idle")} />
						</motion.div>
					)}
				</AnimatePresence>
			</section>

			<HowItWorks />
			<Scoring />
			<Features />
			<HouseSection />
			<ShopSection />
			<InstallSection />
			<Footer />
		</div>
	);
}

function getHint(phase: Phase): string {
	switch (phase) {
		case "idle":
			return "Ring the doorbell or tap the door to come inside";
		case "opening":
			return "Knock knock…";
		case "checking":
			return "Checking who's home…";
		default:
			return "Come on in";
	}
}

function HowItWorks() {
	const steps = [
		{
			step: "01",
			title: "Ring a friend",
			body: "Pick any mutual friend and press the bell. A time-sensitive notification wakes their phone instantly.",
		},
		{
			step: "02",
			title: "They answer the door",
			body: "They have 30 seconds to open the app and accept the ring before the server-side countdown expires.",
		},
		{
			step: "03",
			title: "Points on the line",
			body: "Answer in time and you catch them. Miss the door and you take the loss. Your rank updates instantly.",
		},
	];

	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<div className="text-center">
				<h2 className="font-display font-extrabold text-3xl tracking-tight sm:text-4xl">
					How it works
				</h2>
				<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
					One tap starts a 30-second showdown with real stakes.
				</p>
			</div>

			<div className="mt-12 grid gap-4 sm:grid-cols-3">
				{steps.map((item, index) => (
					<Reveal index={index} key={item.step}>
						<Card className="h-full">
							<CardHeader>
								<span className="font-bold font-display text-primary text-sm">
									{item.step}
								</span>
								<CardTitle className="mt-1 text-lg">{item.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{item.body}
								</p>
							</CardContent>
						</Card>
					</Reveal>
				))}
			</div>
		</section>
	);
}

function Scoring() {
	const rows = [
		{
			label: "Answer the door in time",
			result: "+10 to you, −5 to the ringer",
			tone: "text-success",
		},
		{
			label: "Let the timer run out",
			result: "−10 to you",
			tone: "text-destructive",
		},
		{
			label: "Starting balance",
			result: "100 points",
			tone: "text-foreground",
		},
	];

	return (
		<section className="border-y bg-muted/40 py-20">
			<div className="mx-auto max-w-5xl px-6">
				<div className="grid items-center gap-10 lg:grid-cols-2">
					<Reveal>
						<h2 className="font-display font-extrabold text-3xl tracking-tight sm:text-4xl">
							Every ring has real stakes
						</h2>
						<p className="mt-4 text-muted-foreground">
							The countdown is authoritative — resolved on the server, never on
							the client. You can't cheat the clock, and your points ledger is
							append-only, so every gain and loss is auditable.
						</p>
					</Reveal>

					<div className="space-y-3">
						{rows.map((row, index) => (
							<Reveal index={index} key={row.label}>
								<div className="flex items-center justify-between rounded-2xl border bg-background px-5 py-4">
									<span className="font-medium text-sm">{row.label}</span>
									<span className={`font-semibold text-sm ${row.tone}`}>
										{row.result}
									</span>
								</div>
							</Reveal>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function Features() {
	const features = [
		{
			icon: "bell",
			title: "Friends only",
			body: "Ringing is only allowed between mutual friends. No strangers buzzing your phone.",
		},
		{
			icon: "bolt",
			title: "Time-sensitive push",
			body: "Rings break through Do Not Disturb with high-priority, time-sensitive notifications.",
		},
		{
			icon: "shield",
			title: "Fair-play guardrails",
			body: "Per-target cooldowns, quiet hours, block & mute, and a daily loss cap keep it fun.",
		},
		{
			icon: "trophy",
			title: "Leaderboards",
			body: "Climb the global and friends leaderboards — or spend points to tip the odds.",
		},
	];

	const icons: Record<string, React.ReactNode> = {
		bell: (
			<path
				d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
		bolt: (
			<path
				d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
		shield: (
			<path
				d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
		trophy: (
			<path
				d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	};

	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<div className="text-center">
				<h2 className="font-display font-extrabold text-3xl tracking-tight sm:text-4xl">
					Built to be fair, built to be loud
				</h2>
				<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
					The whole game lives in the gap between a notification and a
					countdown.
				</p>
			</div>

			<div className="mt-12 grid gap-4 sm:grid-cols-2">
				{features.map((feature, index) => (
					<Reveal index={index} key={feature.title}>
						<div className="flex gap-4 rounded-2xl border bg-background p-5 transition-shadow hover:shadow-lg">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<svg
									aria-hidden="true"
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									viewBox="0 0 24 24"
								>
									{icons[feature.icon]}
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{feature.title}</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{feature.body}
								</p>
							</div>
						</div>
					</Reveal>
				))}
			</div>
		</section>
	);
}

function HouseSection() {
	const upgrades = [
		{
			icon: "camera",
			title: "Camera doorbell",
			body: "See exactly who's ringing before you answer. Without one, ringers stay a mystery.",
		},
		{
			icon: "music",
			title: "Six ring sounds",
			body: "From a classic ding-dong to a rising marimba riff. Preview every one before you buy.",
		},
		{
			icon: "spark",
			title: "Built with points",
			body: "Catch friends to earn points, then spend them on your doorstep. Earned, not bought.",
		},
	] as const;

	return (
		<section className="border-y bg-muted/40 py-20">
			<div className="mx-auto max-w-5xl px-6">
				<Reveal>
					<div className="text-center">
						<h2 className="font-display font-extrabold text-3xl tracking-tight sm:text-4xl">
							Every door tells your story
						</h2>
						<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
							Five doors, each with its own wall, its own bell, and its own
							sound. Your doorstep is the first thing ringers see.
						</p>
					</div>
				</Reveal>

				{/* Door showcase */}
				<div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
					{DOOR_SKINS.map((skin, index) => (
						<ShowcaseDoor index={index} key={skin.id} skin={skin} />
					))}
				</div>

				{/* Upgrade features */}
				<div className="mt-14 grid gap-4 sm:grid-cols-3">
					{upgrades.map((item, index) => (
						<Reveal index={index} key={item.title}>
							<div className="flex gap-4 rounded-2xl border bg-background p-5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									{upgradeIcon(item.icon)}
								</div>
								<div>
									<h3 className="font-semibold">{item.title}</h3>
									<p className="mt-1 text-muted-foreground text-sm">
										{item.body}
									</p>
								</div>
							</div>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}

function ShowcaseDoor({
	skin,
	index,
}: {
	skin: (typeof DOOR_SKINS)[number];
	index: number;
}) {
	const { theme } = skin;
	return (
		<Reveal index={index}>
			<div className="group flex flex-col items-center gap-3">
				<div
					className="relative h-40 w-28 overflow-hidden rounded-xl shadow-lg ring-1 ring-border/50 transition-transform duration-300 group-hover:-translate-y-1.5"
					style={{
						background: `linear-gradient(180deg, ${theme.wall.from}, ${theme.wall.to})`,
					}}
				>
					{/* Doorway — frame + door (door's own 160:300 aspect, no gaps) */}
					<div className="absolute top-9 bottom-3 left-2 w-[4.5rem]">
						<div
							aria-hidden="true"
							className="absolute inset-0 border-4"
							style={{
								borderColor: theme.frame,
								boxShadow: `inset 0 0 0 2px ${theme.frame}`,
							}}
						/>
						<div className="absolute inset-[4px]">
							<DoorArt className="h-full w-full" theme={theme} />
						</div>
					</div>
					{/* Bell on the wall */}
					{theme.bellStyle === "knocker" ? null : (
						<div aria-hidden="true" className="absolute top-[46%] right-1 z-20">
							<HouseBell
								cameraDoorbell={false}
								interactive={false}
								theme={theme}
							/>
						</div>
					)}
				</div>
				<div className="text-center">
					<p className="font-bold font-display text-sm">{skin.name}</p>
					<p className="text-muted-foreground text-xs">
						{skin.pricePoints === 0
							? "Included"
							: `${skin.pricePoints.toLocaleString()} pts`}
					</p>
				</div>
			</div>
		</Reveal>
	);
}

function upgradeIcon(icon: "camera" | "music" | "spark") {
	const paths: Record<string, React.ReactNode> = {
		camera: (
			<path
				d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
		music: (
			<path
				d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
		spark: (
			<path
				d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	};
	return (
		<svg
			aria-hidden="true"
			className="h-5 w-5"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			viewBox="0 0 24 24"
		>
			{paths[icon]}
		</svg>
	);
}

function ShopSection() {
	const items = [
		{
			title: "Doors",
			body: "Five designs, each with its own wall and hardware — from warm oak to a neon night.",
			points: "From 500 pts",
		},
		{
			title: "Ring sounds",
			body: "Classic ding-dong, knock-knock, an old crank, a synth glide and more. Equip one.",
			points: "From 400 pts",
		},
		{
			title: "Upgrades",
			body: "A spy camera, or a camera doorbell that finally shows you who's ringing.",
			points: "From 800 pts",
		},
		{
			title: "Time Shields",
			body: "Arm before someone rings and buy yourself an extra 15 seconds to answer.",
			points: "Real-money pack",
		},
	];

	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<Reveal>
				<div className="text-center">
					<h2 className="font-display font-extrabold text-3xl tracking-tight sm:text-4xl">
						Earn points. Spend them on the door.
					</h2>
					<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
						Catch a friend to earn, lose to protect your doorstep. Every point
						you spend goes straight into your house.
					</p>
				</div>
			</Reveal>

			<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item, index) => (
					<Reveal index={index} key={item.title}>
						<Card className="h-full transition-shadow hover:shadow-lg">
							<CardHeader>
								<CardTitle className="text-lg">{item.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{item.body}
								</p>
								<p className="mt-3 font-semibold text-primary text-sm">
									{item.points}
								</p>
							</CardContent>
						</Card>
					</Reveal>
				))}
			</div>
		</section>
	);
}

function InstallSection() {
	return (
		<section className="mx-auto max-w-5xl px-6 py-20">
			<Card className="overflow-hidden border-primary/30 bg-primary/5">
				<div className="flex flex-col items-center gap-6 px-8 py-14 text-center sm:flex-row sm:text-left">
					<div className="flex-1">
						<h2 className="font-display font-extrabold text-2xl tracking-tight sm:text-3xl">
							Put DingDongDitch on your home screen
						</h2>
						<p className="mt-3 text-muted-foreground">
							Install it like an app on iOS or Android. Notifications are the
							whole game — don't miss the doorbell.
						</p>
					</div>
					<div className="shrink-0">
						<InstallAppButton />
					</div>
				</div>
			</Card>
		</section>
	);
}

function Footer() {
	return (
		<footer className="border-t py-10">
			<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-muted-foreground text-sm sm:flex-row">
				<span className="font-semibold text-foreground">DingDongDitch</span>
				<span>Ring the doorbell. Beat the clock.</span>
				<span>© {new Date().getFullYear()} Christopher Tønnesland · MIT</span>
			</div>
		</footer>
	);
}

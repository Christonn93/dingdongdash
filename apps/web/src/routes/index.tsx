import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";

import { InstallAppButton } from "@/components/install-app-button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const { data: session } = authClient.useSession();

	return (
		<div className="min-h-full overflow-x-hidden">
			<Hero authed={!!session?.user} />
			<HowItWorks />
			<Scoring />
			<Features />
			<InstallSection />
			<Footer />
		</div>
	);
}

function Hero({ authed }: { authed: boolean }) {
	return (
		<section className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10"
			>
				<div className="absolute top-0 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
			</div>

			<span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5"
					fill="currentColor"
					viewBox="0 0 24 24"
				>
					<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
				</svg>
				Real-time social game
			</span>

			<h1 className="mt-6 font-bold text-5xl text-foreground tracking-tight sm:text-7xl">
				Ring the doorbell.
				<br />
				<span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
					Beat the clock.
				</span>
			</h1>

			<p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
				Ding someone and see if they answer in time. Catch them for points — or
				they ditch you and you lose. Every ring is a 30-second showdown.
			</p>

			<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
				{authed ? (
					<Link to="/dashboard">
						<Button size="lg">
							<svg
								aria-hidden="true"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<path
									d="M17 8l4 4m0 0l-4 4m4-4H3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							Go to the game
						</Button>
					</Link>
				) : (
					<Link to="/login">
						<Button size="lg">Get started free</Button>
					</Link>
				)}
				<Link to="/login">
					<Button size="lg" variant="outline">
						Sign in
					</Button>
				</Link>
				<InstallAppButton />
			</div>

			<p className="mt-6 text-muted-foreground text-sm">
				Everyone starts with 1,000 points. No sign-up cost. Free to play.
			</p>
		</section>
	);
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
				<h2 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
					How it works
				</h2>
				<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
					One tap starts a 30-second showdown with real stakes.
				</p>
			</div>

			<div className="mt-12 grid gap-4 sm:grid-cols-3">
				{steps.map((item) => (
					<Card className="border-border/60" key={item.step}>
						<CardHeader>
							<span className="font-semibold text-primary text-sm">
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
			tone: "text-green-600 dark:text-green-400",
		},
		{
			label: "Let the timer run out",
			result: "−10 to you",
			tone: "text-red-600 dark:text-red-400",
		},
		{
			label: "Starting balance",
			result: "1,000 points",
			tone: "text-foreground",
		},
	];

	return (
		<section className="border-border/60 border-y bg-muted/40 py-20">
			<div className="mx-auto max-w-5xl px-6">
				<div className="grid items-center gap-10 lg:grid-cols-2">
					<div>
						<h2 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
							Every ring has real stakes
						</h2>
						<p className="mt-4 text-muted-foreground">
							The countdown is authoritative — resolved on the server, never on
							the client. You can't cheat the clock, and your points ledger is
							append-only, so every gain and loss is auditable.
						</p>
					</div>

					<div className="space-y-3">
						{rows.map((row) => (
							<div
								className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-5 py-4"
								key={row.label}
							>
								<span className="font-medium text-foreground text-sm">
									{row.label}
								</span>
								<span className={`font-semibold text-sm ${row.tone}`}>
									{row.result}
								</span>
							</div>
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
				<h2 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
					Built to be fair, built to be loud
				</h2>
				<p className="mx-auto mt-3 max-w-lg text-muted-foreground">
					The whole game lives in the gap between a notification and a
					countdown.
				</p>
			</div>

			<div className="mt-12 grid gap-4 sm:grid-cols-2">
				{features.map((feature) => (
					<div
						className="flex gap-4 rounded-lg border border-border/60 p-5"
						key={feature.title}
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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
							<h3 className="font-semibold text-foreground">{feature.title}</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								{feature.body}
							</p>
						</div>
					</div>
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
						<h2 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
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
		<footer className="border-border/60 border-t py-10">
			<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-muted-foreground text-sm sm:flex-row">
				<span className="font-semibold text-foreground">DingDongDitch</span>
				<span>Ring the doorbell. Beat the clock.</span>
				<span>© {new Date().getFullYear()} Christopher Tønnesland · MIT</span>
			</div>
		</footer>
	);
}

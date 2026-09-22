import { Link } from "@tanstack/react-router";

import { InstallAppButton } from "./install-app-button";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [
		{ label: "Home", to: "/" },
		{ label: "Dashboard", to: "/dashboard" },
		{ label: "Friends", to: "/friends" },
		{ label: "Leaderboard", to: "/leaderboard" },
		{ label: "Shop", to: "/store" },
		{ label: "Profile", to: "/profile" },
	] as const;

	return (
		<header className="sticky top-0 z-50 border-border/60 border-b bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<Link
						className="flex shrink-0 items-center gap-2 rounded-xl font-display font-extrabold text-sm tracking-tight"
						to="/"
					>
						<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 shadow-md transition-transform hover:scale-105">
							<svg
								aria-hidden="true"
								className="h-4 w-4 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
							</svg>
						</span>
						<span className="hidden sm:inline">DingDongDitch</span>
					</Link>
					<nav className="flex items-center gap-0.5 text-sm">
						{links.map(({ to, label }) => (
							<Link
								className="rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary"
								key={to}
								to={to}
							>
								{label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<InstallAppButton />
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}

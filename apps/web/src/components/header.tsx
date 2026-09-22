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
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<div className="flex flex-row items-center gap-4">
					<Link
						className="flex items-center gap-2 font-semibold text-foreground"
						to="/"
					>
						<span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600">
							<svg
								aria-hidden="true"
								className="h-4 w-4 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
							</svg>
						</span>
						<span className="text-sm">DingDongDitch</span>
					</Link>
					<nav className="flex gap-4 text-sm">
						{links.map(({ to, label }) => (
							<Link
								className="text-muted-foreground transition-colors hover:text-foreground [&.active]:font-medium [&.active]:text-foreground"
								key={to}
								to={to}
							>
								{label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					<InstallAppButton />
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}

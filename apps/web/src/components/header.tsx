import { Link } from "@tanstack/react-router";

import { InstallAppButton } from "./install-app-button";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { NavLinks } from "./nav-links";
import UserMenu from "./user-menu";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 w-full min-w-0 overflow-x-clip border-border/60 border-b bg-background/80 backdrop-blur-md">
			<div className="mx-auto w-full max-w-6xl">
				<div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3 sm:px-4">
					<Link
						className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl font-display font-extrabold text-sm tracking-tight"
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

					<nav
						aria-label="Primary"
						className="hidden min-w-0 flex-1 items-center gap-0.5 px-2 text-sm md:flex"
					>
						<NavLinks />
					</nav>

					<div className="flex shrink-0 items-center gap-1.5">
						<div className="hidden items-center gap-1.5 md:flex">
							<InstallAppButton />
							<ModeToggle />
						</div>
						<UserMenu />
						<MobileNav />
					</div>
				</div>
			</div>
		</header>
	);
}

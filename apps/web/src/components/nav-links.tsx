import { Link } from "@tanstack/react-router";

export const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "Dashboard", to: "/dashboard" },
	{ label: "Friends", to: "/friends" },
	{ label: "Leaderboard", to: "/leaderboard" },
	{ label: "Shop", to: "/store" },
	{ label: "Profile", to: "/profile" },
] as const;

const PILL_CLASS =
	"rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary";

export function NavLinks({
	className = "flex flex-wrap items-center gap-0.5",
	linkClassName = PILL_CLASS,
	onNavigate,
}: {
	className?: string;
	linkClassName?: string;
	onNavigate?: () => void;
}) {
	return (
		<div className={className}>
			{NAV_LINKS.map(({ to, label }) => (
				<Link className={linkClassName} key={to} onClick={onNavigate} to={to}>
					{label}
				</Link>
			))}
		</div>
	);
}

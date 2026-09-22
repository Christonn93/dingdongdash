import { cn } from "cn";

export type AppAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AppAvatarProps {
	/** Slug from the seeded avatar catalog, e.g. `adventurer-1`. */
	avatarId?: string | null;
	className?: string;
	/**
	 * Accessible name used when the avatar stands alone. When the avatar sits
	 * next to visible text that already names the person, omit this and the
	 * imagery is hidden from screen readers.
	 */
	label?: string;
	name?: string | null;
	size?: AppAvatarSize;
}

const SIZE_CLASSES: Record<AppAvatarSize, string> = {
	lg: "size-14 text-base",
	md: "size-10 text-sm",
	sm: "size-8 text-xs",
	xl: "size-16 text-lg",
	xs: "size-6 text-[10px]",
};

const BACKDROP_PALETTE = [
	"from-red-400 to-red-600",
	"from-violet-400 to-indigo-600",
	"from-amber-300 to-orange-500",
	"from-emerald-300 to-green-600",
	"from-cyan-300 to-blue-500",
	"from-pink-300 to-rose-500",
	"from-yellow-300 to-amber-500",
	"from-fuchsia-400 to-purple-600",
] as const;

const FALLBACK_PALETTE = [
	"bg-primary/15 text-primary",
	"bg-violet-200/70 text-violet-700 dark:bg-violet-500/25 dark:text-violet-200",
	"bg-amber-200/70 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
	"bg-emerald-200/70 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
	"bg-sky-200/70 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
] as const;

const NAME_SEGMENTS = /\s+/;

function hashOf(value: string): number {
	let hash = 0;
	for (const char of value) {
		hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
	}
	return hash;
}

/** Deterministic (never random) fallback avatar color derived from a name. */
export function avatarFallbackClass(name?: string | null): string {
	const base = name?.trim() ?? "";
	return (
		FALLBACK_PALETTE[hashOf(base) % FALLBACK_PALETTE.length] ??
		FALLBACK_PALETTE[0]
	);
}

export function avatarInitials(name?: string | null): string {
	return (name ?? "?")
		.split(NAME_SEGMENTS)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

/**
 * Product avatar: renders the seeded avatar image (served same-origin at
 * `/avatars/{id}`) on a deterministic gradient backdrop, falling back to a
 * polished initials badge when the id is missing or the image fails to load.
 */
export function AppAvatar({
	avatarId,
	className,
	label,
	name,
	size = "md",
}: AppAvatarProps) {
	const sizeClass = SIZE_CLASSES[size];
	const activeId = avatarId?.trim();

	if (activeId) {
		const classes = cn(
			"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
			BACKDROP_PALETTE[hashOf(activeId) % BACKDROP_PALETTE.length],
			sizeClass,
			className
		);
		const image = (
			<img
				alt=""
				className="h-[78%] w-[78%] object-contain"
				draggable={false}
				height={128}
				src={`/avatars/${activeId}`}
				width={128}
			/>
		);
		if (label) {
			return (
				<span aria-label={label} className={classes} role="img">
					{image}
				</span>
			);
		}
		return (
			<span aria-hidden="true" className={classes}>
				{image}
			</span>
		);
	}

	const classes = cn(
		"relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-wide",
		avatarFallbackClass(name),
		sizeClass,
		className
	);
	if (label) {
		return (
			<span aria-label={label} className={classes} role="img">
				{avatarInitials(name)}
			</span>
		);
	}
	return (
		<span aria-hidden="true" className={classes}>
			{avatarInitials(name)}
		</span>
	);
}

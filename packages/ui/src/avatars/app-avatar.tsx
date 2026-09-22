import type { AvatarId } from "@dingdongdash/db/game";
import { cn } from "cn";

import { AvatarArt } from "./avatar-art";
import { avatarSpecs } from "./avatar-config";

export type AppAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AppAvatarProps {
	avatarId?: AvatarId | null;
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

const FALLBACK_PALETTE = [
	"bg-primary/15 text-primary",
	"bg-violet-200/70 text-violet-700 dark:bg-violet-500/25 dark:text-violet-200",
	"bg-amber-200/70 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200",
	"bg-emerald-200/70 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200",
	"bg-sky-200/70 text-sky-700 dark:bg-sky-500/25 dark:text-sky-200",
] as const;

const NAME_SEGMENTS = /\s+/;

/** Deterministic (never random) fallback avatar color derived from a name. */
export function avatarFallbackClass(name?: string | null): string {
	const base = name?.trim() ?? "";
	let hash = 0;
	for (const char of base) {
		hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
	}
	return (
		FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length] ?? FALLBACK_PALETTE[0]
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
 * Product avatar: renders a selectable local SVG avatar when `avatarId` is
 * valid, and falls back to a polished initials badge otherwise. Safe for
 * missing names and invalid ids.
 */
export function AppAvatar({
	avatarId,
	className,
	label,
	name,
	size = "md",
}: AppAvatarProps) {
	const spec = avatarId ? avatarSpecs[avatarId] : undefined;
	const sizeClass = SIZE_CLASSES[size];

	if (avatarId && spec) {
		const classes = cn(
			"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br",
			spec.backdrop,
			sizeClass,
			className
		);
		if (label) {
			return (
				<span aria-label={label} className={classes} role="img">
					<AvatarArt className="h-[62%] w-[62%]" id={avatarId} />
				</span>
			);
		}
		return (
			<span aria-hidden="true" className={classes}>
				<AvatarArt className="h-[62%] w-[62%]" id={avatarId} />
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

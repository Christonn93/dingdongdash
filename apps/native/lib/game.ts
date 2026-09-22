/**
 * DingDongDitch game helpers — ranks, streaks, flavour text.
 * Pure functions, no React, safe to share between screens.
 */

export interface Rank {
	emoji: string;
	/** Points needed to reach this rank. */
	min: number;
	title: string;
}

export const RANKS: Rank[] = [
	{ emoji: "👑", min: 7500, title: "Doorway Deity" },
	{ emoji: "🌟", min: 5000, title: "Street Legend" },
	{ emoji: "🔥", min: 3500, title: "Doorbell Pro" },
	{ emoji: "🏃", min: 2000, title: "Door Dasher" },
	{ emoji: "🏡", min: 1000, title: "Neighbor" },
	{ emoji: "🐣", min: 0, title: "Fresh Face" },
];

export function rankForPoints(points: number): Rank {
	return RANKS.find((rank) => points >= rank.min) ?? RANKS[0];
}

export function nextRankForPoints(points: number): Rank | null {
	const current = rankForPoints(points);
	const index = RANKS.indexOf(current);
	return index > 0 ? RANKS[index - 1] : null;
}

export function streakLabel(streak: number): string {
	if (streak <= 1) {
		return "Catch streak";
	}
	return `${streak}x catch streak`;
}

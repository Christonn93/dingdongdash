import confetti from "canvas-confetti";

const COLORS = ["#f0563d", "#ffd166", "#ffffff", "#7c6cff", "#43c18a"];

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface CelebrateOptions {
	originX?: number;
	originY?: number;
	particleCount?: number;
	spread?: number;
}

/** A satisfying dopamine burst for catches and wins. */
export function celebrate(options: CelebrateOptions = {}): void {
	if (prefersReducedMotion()) {
		return;
	}
	const {
		originX = 0.5,
		originY = 0.6,
		particleCount = 140,
		spread = 80,
	} = options;
	confetti({
		colors: COLORS,
		origin: { x: originX, y: originY },
		particleCount,
		scalar: 0.9,
		spread,
		startVelocity: 42,
		zIndex: 60,
	});
}

/** A quick side burst — used to double-up the celebration. */
export function celebrateFromSides(): void {
	if (prefersReducedMotion()) {
		return;
	}
	confetti({
		angle: 60,
		colors: COLORS,
		origin: { x: 0, y: 0.7 },
		particleCount: 60,
		spread: 60,
		startVelocity: 45,
		zIndex: 60,
	});
	confetti({
		angle: 120,
		colors: COLORS,
		origin: { x: 1, y: 0.7 },
		particleCount: 60,
		spread: 60,
		startVelocity: 45,
		zIndex: 60,
	});
}

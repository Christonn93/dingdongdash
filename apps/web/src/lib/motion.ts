import type { Transition } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_SNAPPY = [0.32, 0.72, 0, 1] as const;

export const spring: Transition = {
	damping: 30,
	mass: 0.8,
	stiffness: 420,
	type: "spring",
};

export const doorSpring: Transition = {
	damping: 16,
	stiffness: 140,
	type: "spring",
};

export const softSpring: Transition = {
	damping: 26,
	stiffness: 260,
	type: "spring",
};

export const fadeUp: Transition = {
	duration: 0.55,
	ease: EASE_OUT,
};

export const staggerDelay = (index: number, base = 0.06): Transition => ({
	...fadeUp,
	delay: index * base,
});

import { useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import type { ReactNode } from "react";

import { fadeUp } from "@/lib/motion";

/** Animates each route change in with a soft fade + rise. */
export function PageTransition({ children }: { children: ReactNode }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return children;
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			initial={{ opacity: 0, y: 10 }}
			key={pathname}
			transition={fadeUp}
		>
			{children}
		</motion.div>
	);
}

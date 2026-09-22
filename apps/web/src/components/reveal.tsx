import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { staggerDelay } from "@/lib/motion";

interface RevealProps {
	children: ReactNode;
	className?: string;
	index?: number;
}

/** Staggered fade-up reveal used across lists and cards. */
export function Reveal({ children, className, index = 0 }: RevealProps) {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={className}
			initial={{ opacity: 0, y: 20 }}
			transition={staggerDelay(index)}
		>
			{children}
		</motion.div>
	);
}

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
	className?: string;
	value: number;
}

/** Counts up to `value` whenever it changes — dopamine for point gains. */
export function AnimatedNumber({ className, value }: AnimatedNumberProps) {
	const reduceMotion = useReducedMotion();
	const [display, setDisplay] = useState(value);
	const previous = useRef(value);

	useEffect(() => {
		if (reduceMotion) {
			setDisplay(value);
			previous.current = value;
			return;
		}
		const controls = animate(previous.current, value, {
			duration: 0.7,
			ease: [0.22, 1, 0.36, 1],
			onUpdate: (next) => setDisplay(Math.round(next)),
		});
		previous.current = value;
		return () => controls.stop();
	}, [reduceMotion, value]);

	return <span className={className}>{display.toLocaleString()}</span>;
}

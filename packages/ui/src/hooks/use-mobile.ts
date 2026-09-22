"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** Returns true when the viewport is narrower than the mobile breakpoint. */
export function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		undefined
	);

	React.useEffect(() => {
		const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	return Boolean(isMobile);
}

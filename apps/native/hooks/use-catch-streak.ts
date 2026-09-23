import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

/**
 * Catch streak — computed from the points ledger: the count of consecutive
 * win entries ("catch" — you answered in time, or "ditch_reward" — you caught
 * the ringer napping) trailing back from now. Any loss entry (ditch, being
 * caught, purchase, …) resets it.
 */

export function useCatchStreak(): { isLoading: boolean; streak: number } {
	const ledger = useQuery(
		trpc.points.getLedger.queryOptions({ cursor: undefined, limit: 30 })
	);

	const entries = ledger.data?.entries ?? [];
	let streak = 0;
	for (const entry of entries) {
		if (entry.reason !== "catch" && entry.reason !== "ditch_reward") {
			break;
		}
		streak += 1;
	}

	return { isLoading: ledger.isLoading, streak };
}

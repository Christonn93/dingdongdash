import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

/**
 * Catch streak — computed from the points ledger: the count of consecutive
 * "catch" entries trailing back from now. A fresh catch keeps it alive, any
 * other entry (ditch, purchase, …) resets it.
 */

export function useCatchStreak(): { isLoading: boolean; streak: number } {
	const ledger = useQuery(
		trpc.points.getLedger.queryOptions({ cursor: undefined, limit: 30 })
	);

	const entries = ledger.data?.entries ?? [];
	let streak = 0;
	for (const entry of entries) {
		if (entry.reason !== "catch") {
			break;
		}
		streak += 1;
	}

	return { isLoading: ledger.isLoading, streak };
}

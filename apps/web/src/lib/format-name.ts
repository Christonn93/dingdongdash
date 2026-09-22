const WHITESPACE = /\s+/;

/**
 * Shortens a full name for compact header displays.
 *
 * Examples:
 *   "Christopher Tønnesland"       -> "C. Tønnesland"
 *   "Christopher Johan Tønnesland" -> "C. Tønnesland"
 *   "Christopher"                  -> "C."
 *   "  " / ""                      -> ""
 */
export function formatShortName(fullName: string): string {
	const parts = fullName.trim().split(WHITESPACE).filter(Boolean);
	if (parts.length === 0) {
		return "";
	}
	const initial = parts[0]?.charAt(0).toUpperCase() ?? "";
	if (parts.length === 1) {
		return `${initial}.`;
	}
	const lastName = parts.at(-1) ?? "";
	return `${initial}. ${lastName}`;
}

export const STARTING_POINTS = 100;

export const RING_DURATION_MS = 30_000;

/** Maximum rings a user can send to the same target within the cooldown window. */
export const RING_COOLDOWN_MS = 60 * 60 * 1000;

/** A pending friendship created from a contacts import is auto-accepted only
 * when both users have each other in their address books. */
export const CONTACT_IMPORT_MAX_HASHES = 10_000;

export const LEDGER_PAGE_SIZE = 20;

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const MAX_INVITES_PER_DAY = 20;

export const CATCH_REWARD = 10;
export const CATCH_PENALTY = 5;
export const DITCH_PENALTY = 10;

/** Points granted once per UTC day for logging in. */
export const DAILY_BONUS_POINTS = 25;

/** Extra points on top of the daily bonus when a login streak hits a 7-day milestone. */
export const STREAK_MILESTONE_BONUS = 50;

/** Extra seconds a Time Shield adds to an incoming ring's countdown. */
export const TIME_SHIELD_EXTENSION_MS = 15_000;

export const TIME_SHIELDS_PER_PACK = 3;

export const PUSH_FEEDBACK_SKIP_REASONS = [
	"DeviceNotRegistered",
	"MessageTooBig",
] as const;

# In-game friend discovery + requests — design

Date: 2026-09-22
Status: Approved
Scope: Web app + API + DB. Native gets push delivery only (no deep-links this pass).

## Goal

Let players grow their friend list from inside the game:

1. Add friends directly from the Leaderboard.
2. Discover people **in my area** (IP-detected region).
3. Discover people at a **similar score** (±25% band).
4. Recipients get notified (push/email/sms + in-app toast) when someone requests them.

## Decisions

- **Area detection**: IP-based, via Cloudflare. Server reads `request.cf.country` / `request.cf.city`
  (fallback `CF-IPCountry` / `CF-IPCity` headers) and stores nullable `area_country` / `area_city`
  on the user. "In your area" = same city, else same country when I have no city. No opt-out toggle in v1.
- **Score ratio**: points within ±25% of mine: `points BETWEEN round(my·0.75) AND round(my·1.25)`,
  using the denormalized `user.points`.
- **UI**: Leaderboard gains tabs (All / In your area / Similar score) with relationship-aware
  row actions; Friends page "Find more friends" gains compact *People nearby* + *Similar scores* cards.
- **Notifications**: new `friend_request` event in `notifyUser`, reusing the existing "results"
  channel prefs (no new pref columns). In-app toast via a light poll of incoming-request count.

## Data model

`user` table gains two nullable columns (migration required):

- `area_country` (text, ISO-3166-1 alpha-2, nullable)
- `area_city` (text, nullable)

Better Auth `additionalFields` updated so the region round-trips in `session.user`.

## Backend

- **Region capture** (`apps/server/src/context.ts`): when a session exists and the detected region
  differs from the stored region, issue one conditional `UPDATE user`. Detected region is also placed
  on the tRPC `Context` (`areaCountry` / `areaCity`) so routers can filter without a re-read.
  No CF headers in local dev → region null → area queries return empty (UI shows a gentle note).
- **`leaderboard.getGlobal`** gains `scope: "all" | "area" | "score"` (default `"all"`). Each row gains
  `relationship: "me" | "friend" | "incoming" | "outgoing" | "none"` and `incomingFriendshipId`
  (present only for `incoming`). Response gains `region: { country, city }` for the caller's detected
  region (drives the area-tab empty-state note). Ranks continue across the filtered, ordered set.
- **`friends.discover`** (new, unpaginated, small): returns `{ area: [...], similar: [...] }`, each up
  to 5 rows with the same relationship fields. `similar` sorted by `|points − my|` then points desc;
  `area` by points desc.
- **`friends.sendRequest`**: notify the target via `notifyUser` with a `friend_request` event **only**
  when this call creates a genuinely new pending request (no existing pending pair in either direction).
  Sender gets the existing local toast.
- **`notifyUser`**: `NotifyEvent` gains `"friend_request"`. Channel = "results" prefs. Email variant:
  eyebrow "New friend request", CTA "View requests" → `/friends`. Push `data.type: "friend_request"`
  plus `fromUserId` / `fromName`.

## Web UI

- **Leaderboard** (`/leaderboard`): tabs All / In your area / Similar score (initial tab reads `?scope=`).
  Row action by relationship: `Add` (sendRequest → "Request sent"), `Pending` (disabled), `Accept`
  (acceptRequest with row `incomingFriendshipId`), `Friends` (badge). Area tab empty + no detected
  region → "We detect your area from your connection — open the app to set it."
- **Friends page**: "Find more friends" gains two compact cards fed by `friends.discover`, each with
  the same row actions and a "See all on the leaderboard" link. A light poll toasts when the
  incoming-request count increases between refreshes.
- **Profile**: subtle "Area: Oslo, NO · approximate" line when a region is stored.

## Out of scope

Location opt-out toggle, adjustable ratio bands, photo upload, native deep-linking, request
management beyond accept/pending/friends, phone-number area matching.

## Validation

`tsc --noEmit` in db/auth/api/server/web; `bun run build` in apps/web + apps/server;
migration generated via `bunx drizzle-kit generate` (from packages/db) and syntax-checked against
a throwaway SQLite db; scoped `bun x ultracite check` on touched files.
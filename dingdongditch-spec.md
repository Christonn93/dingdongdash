# DingDongDitch — App Specification & Build Guide

Version 1.0 — Draft for development, written for use with AI coding agents (Claude Code, Cursor, OpenCode, etc.)

## 1. Concept Summary

DingDongDitch is a real-time social mobile game. User A "rings the bell" on User B's profile. User B has a fixed countdown (default 30 seconds) to open the app and "answer the door" to see who rang. If User B answers in time, User B "catches" User A. If the timer expires, User A "ditches" successfully.

- **Catch (User B opens in time):** User B +10 points, User A −5 points (User A's penalty is capped by the rolling 24h loss floor).
- **Ditch (User B fails to open in time):** User B −10 points (capped by the rolling 24h loss floor), User A +10 points.
- All users start with 100 points.
- Points can be topped up with real-money in-app purchases (pay-to-win economy, not redeemable for cash — see Section 6).
- Users can spend real money on consumable items (e.g., time-extension shields) that improve their odds of catching or ditching.
- Global and friends-based leaderboards ranked by point total.
- Friend graph sourced from phone contacts and/or Facebook friends who also use the app.

## 2. Core Game Loop

1. User A opens the app, selects a friend (User B), taps "Ring."
2. Backend creates a `Ring` event, starts an authoritative server-side countdown (default 30s), and pushes a high-priority, time-sensitive notification to User B's device.
3. User B's device displays a full-screen "incoming ring" UI (similar to an incoming call screen) so the OS surfaces it even if the app is backgrounded.
4. User B taps "Open Door" before the countdown ends.
5. Server resolves the event:
   - If opened before expiry → `CAUGHT`. User B +10, User A −5.
   - If expiry passes with no action → `DITCHED`. User B −10, User A +10.
6. Result is written to the points ledger, both users' totals update, leaderboard recalculates.
7. Both users see a result screen (who rang, outcome, new point totals).

### Edge Cases To Design For

- User B has no connectivity when rung — treat as a ditch once timer expires; do not penalize twice if the app later reconnects and finds the ring already resolved.
- User B is mid-ring on someone else — allow concurrent incoming rings, resolve independently.
- User A rings the same target repeatedly — apply a cooldown (see Section 7) to prevent harassment.
- Clock trust — the countdown must be resolved server-side; the client only reflects state, never decides outcome.

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile client | Expo (React Native + TypeScript) | Matches existing skillset; use Expo Router for navigation |
| Push notifications | Expo Notifications + APNs/FCM | Must support iOS time-sensitive interruption level and Android high-priority channel |
| API layer | Hono on Cloudflare Workers | Matches preferred edge-first stack |
| Type-safe RPC | tRPC | Shared types between client and server |
| Real-time countdown state | Cloudflare Durable Objects | One Durable Object instance per active Ring event; authoritative timer |
| Database | Cloudflare D1 (SQLite) or Postgres (Neon/Supabase) | D1 if staying fully in Cloudflare ecosystem; Postgres if you want richer query tooling |
| Auth | Clerk, Supabase Auth, or custom JWT via Hono middleware | Pick based on whether you want managed auth or full control |
| Payments | Apple In-App Purchase + Google Play Billing (mobile) | Required — cannot route digital-good purchases around platform billing |
| Friend graph | Phone contacts (hashed lookup) primary; Facebook Graph API secondary | Facebook now only surfaces mutual app users who've granted `user_friends` |
| Analytics | PostHog or Amplitude | For funnel tracking on ring→catch conversion and purchase conversion |
| Monorepo tooling | Bun + Turborepo | Matches your existing workflow |

## 4. Data Model (Draft Schema)

```
User
  id            uuid, pk
  displayName   string
  phoneHash     string, indexed        -- for contact-based friend matching
  facebookId    string, nullable
  points        int, default 100       -- denormalized cache, source of truth is ledger
  createdAt     timestamp
  deviceTokens  DeviceToken[]

DeviceToken
  id            uuid, pk
  userId        uuid, fk -> User
  token         string
  platform      enum('ios','android')
  updatedAt     timestamp

Friendship
  id            uuid, pk
  userId        uuid, fk -> User
  friendId      uuid, fk -> User
  status        enum('pending','accepted','blocked')
  createdAt     timestamp
  -- friendship must be mutual/accepted before ringing is allowed

Ring
  id            uuid, pk
  ringerId      uuid, fk -> User        -- User A
  targetId      uuid, fk -> User        -- User B
  createdAt     timestamp
  expiresAt     timestamp                -- createdAt + duration + any purchased extensions
  durationMs    int, default 30000
  status        enum('pending','caught','ditched')
  resolvedAt    timestamp, nullable
  durableObjectId string                 -- reference to the authoritative timer instance

PointsLedgerEntry
  id            uuid, pk
  userId        uuid, fk -> User
  ringId        uuid, fk -> Ring, nullable
  amount        int                      -- positive or negative
  reason        enum('catch','ditch_penalty','ditch_ring_penalty','ditch_reward','purchase','signup_bonus','adjustment')
  createdAt     timestamp
  -- append-only, immutable. User.points is always derivable as SUM(amount) per user.

Purchase
  id                uuid, pk
  userId            uuid, fk -> User
  platform          enum('ios','android')
  productId         string               -- Apple/Google product identifier
  pointsGranted     int, nullable
  itemGranted       enum('time_shield','points_pack', ...), nullable
  amountPaidCents   int
  currency          string
  platformTransactionId string, unique   -- for idempotency / receipt validation
  createdAt         timestamp

LeaderboardSnapshot   -- optional, for performance at scale
  id            uuid, pk
  scope         enum('global','friends')
  userId        uuid, fk -> User, nullable  -- null for global entries
  rank          int
  points        int
  computedAt    timestamp
```

Key principle: **points are never mutated directly.** `User.points` is a cache; the ledger is the source of truth. This makes disputes, chargebacks, and audits tractable, and makes leaderboard math trivially recomputable.

## 5. API Surface (tRPC Router Sketch)

```
auth.signUp / auth.login / auth.refreshToken

users.me
users.updateProfile
users.registerDeviceToken

friends.importContacts(hashedPhoneNumbers[])
friends.importFacebook(facebookFriendIds[])
friends.sendRequest(targetUserId)
friends.acceptRequest(friendshipId)
friends.list()

rings.create(targetUserId) -> Ring        -- rate-limited, checks mutual friendship + cooldown
rings.getActive()                          -- any pending incoming rings for current user
rings.answer(ringId)                       -- attempt to catch; server checks against Durable Object timer
rings.getHistory(cursor)

points.getBalance()
points.getLedger(cursor)

purchases.validateReceipt(platform, receiptData) -> grants points/items, idempotent on platformTransactionId
purchases.getCatalog()                      -- available point packs / time shields with prices

leaderboard.getGlobal(cursor)
leaderboard.getFriends()
```

## 6. Monetization Model

**Principle:** cash flows one direction only — from user to you. Nothing purchasable is ever redeemable for cash or real-world prizes. This keeps DingDongDitch classified as a standard pay-to-win freemium game (like Candy Crush or Clash of Clans), not real-money gaming, under both Apple's App Review Guideline 5.3.3 and Google Play's Real-Money Gambling policy.

Purchasable items:

- **Point top-up packs** — fixed price, fixed point amount (e.g., 500 points for $2.99). No randomization, so no loot-box odds disclosure is required.
- **Time Shield** — consumable that extends your own countdown window if someone rings you (e.g., +15 seconds). Recommend requiring this to be armed *before* being rung, rather than usable reactively mid-countdown, to avoid a "pay after the fact to reverse a loss" feel that could read poorly with users even though it's not a legal issue.
- **Cosmetics** — door skins, ring sounds, profile badges — pure cosmetic, zero gameplay effect, safest monetization category and good for margin since there's no material cost per unit sold.

Implementation requirements:

- All purchases must go through Apple In-App Purchase / Google Play Billing — this is a platform requirement for any digital good unlocking in-app functionality, not optional.
- Validate every receipt server-side (Apple App Store Server API / Google Play Developer API) before granting points or items. Never trust client-reported purchase success.
- Use `platformTransactionId` as an idempotency key so retried or duplicate receipt submissions can't double-grant points.
- Consider a soft daily spend cap, especially if any users may be minors, to reduce predatory-spending risk and app store scrutiny around kids' monetization.

## 7. Anti-Harassment & Fairness Guardrails

Because the core mechanic is "make someone's phone buzz and penalize them if they don't respond fast," this needs deliberate guardrails or it becomes a harassment vector.

- **Mutual opt-in required.** Ringing is only allowed between accepted (mutual) friends — never one-directional adds.
- **Ring cooldown.** Cap how often User A can ring the same target (e.g., once per target per hour) to prevent spam-ringing someone into a point drain.
- **Do Not Disturb windows.** Let users set quiet hours where incoming rings are queued or blocked, not silently ditched against them.
- **Mute/block.** Standard block functionality that also removes the friendship and disables ringing both ways.
- **Fair loss cap.** Consider a daily floor on how many points a user can lose from ditches, so one bad day (or one malicious friend spam-ringing at the cooldown limit) can't tank someone's rank irrecoverably.

## 8. Notification Reliability (Critical Path)

The entire game depends on the 30-second ring notification reliably waking the app. This is the highest technical-risk area.

- **iOS:** Use `interruptionLevel: 'time-sensitive'` or `critical` (critical requires a special Apple entitlement) on the push payload so it can break through Focus modes and be visually prominent. Standard notifications can be delayed or batched by iOS, which would break the game.
- **Android:** Use a high-priority FCM message with a dedicated notification channel configured for heads-up display, and consider a full-screen intent for the incoming-ring UI, similar to how call and alarm apps behave.
- **Fallback:** If push delivery fails or is delayed, the server-side Durable Object timer is still authoritative — the ring resolves as a ditch at expiry regardless of whether the client ever rendered the UI. Log delivery failures separately from gameplay losses so you can distinguish "User B ignored it" from "User B's phone never told them," which matters for support tickets and trust.

## 9. Suggested Build Phases

1. **Foundation** — Auth, user profiles, friend graph (contacts import), basic Expo app shell with navigation.
2. **Core loop** — Ring creation, Durable Object countdown, push notification delivery, answer flow, points ledger, result screen.
3. **Leaderboard** — Global and friends leaderboard views, ranking computation (start naive, add snapshotting if it gets slow).
4. **Monetization** — IAP integration, receipt validation, point packs, Time Shield item, purchase history.
5. **Guardrails & polish** — Cooldowns, block/mute, Do Not Disturb windows, cosmetics, push reliability hardening across both platforms.
6. **Beta & store submission** — TestFlight/Play internal testing, App Store/Play Store listing, age rating, privacy policy covering contacts access and push notifications.

## 10. Open Decisions To Make Before Building

- Auth provider: managed (Clerk/Supabase) vs. fully custom JWT.
- Database: D1 (simpler, fully Cloudflare) vs. Postgres (more powerful querying, still edge-deployable via Neon/Supabase).
- Exact point values and prices for the initial monetization catalog.
- Whether Facebook friend import is worth the integration cost given its restricted API surface, or whether phone contacts alone is sufficient for v1.
- Minimum age / whether the app targets a general audience or explicitly excludes children, which affects monetization caps and privacy compliance (COPPA if any US minors, similar rules in EU/Norway).

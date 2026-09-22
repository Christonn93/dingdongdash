# DingDongDitch — Go-Live Checklist

Everything required to take the app from development to a working production
launch on the web, iOS, and Android. Work through the sections in order.

---

## 1. Deployment & secrets (Cloudflare + Alchemy)

The whole stack deploys through **Alchemy** (`packages/infra/alchemy.run.ts`).

### 1.1 Cloudflare account setup

- Create a Cloudflare account and a zone (or use a workers.dev subdomain to
  start).
- Configure the Alchemy profile so `alchemy dev` and `alchemy deploy` work:

  ```sh
  alchemy profile edit --profile default --add Cloudflare
  ```

- Set a production `ALCHEMY_PASSWORD` (used to encrypt stack state).

### 1.2 Secrets (production)

Add these as secrets in your production environment (Alchemy `.env` /
secret store). Development defaults live in `packages/infra/.env`
(gitignored).

| Secret | Required | Purpose |
|---|---|---|
| `ALCHEMY_PASSWORD` | ✅ | Encrypts Alchemy stack state |
| `CORS_ORIGIN` | ✅ | Allowed web origin (`https://your-domain.com`) |
| `BETTER_AUTH_SECRET` | ✅ | Signs Better Auth sessions — use a long random string |
| `BETTER_AUTH_URL` | ✅ | Set automatically to the Worker URL |
| `PUBLIC_WEB_URL` | ✅ | The web app origin used to build invite links |
| `EXPO_ACCESS_TOKEN` | ✅ | Expo account token for push (see §2) |
| `RESEND_API_KEY` | ✅ | Sends transactional email (see §3) |
| `EMAIL_FROM` | ✅ | Verified sender, e.g. `DingDongDitch <noreply@ditch.app>` |
| `VONAGE_API_KEY` | ⚠️ | SMS delivery (see §4) |
| `VONAGE_API_SECRET` | ⚠️ | SMS delivery |
| `VONAGE_FROM_NUMBER` | ⚠️ | SMS sender number (E.164) |

Any notification channel whose secrets are missing is **silently skipped** at
runtime — the game still works, those channels just don't fire.

### 1.3 Deploy

```sh
bun run deploy        # builds + deploys the Worker, D1, and web site
bun run db:generate   # after any schema change (generates migrations)
```

D1 migrations are applied as part of the deploy; you can also run
`drizzle-kit migrate` against the production database.

---

## 2. Push notifications (Expo + iOS/Android)

The game depends on the 30-second ring notification arriving reliably.

1. Create an **Expo account** and generate an access token from
   https://expo.dev/settings/access-tokens. Put it in `EXPO_ACCESS_TOKEN`.
2. Install `expo-notifications` in `apps/native`:
   ```sh
   cd apps/native && bun add expo-notifications@~57.0.20
   ```
3. Native clients already register their Expo push token via
   `users.registerDeviceToken`. The server sends through the Expo Push API with
   `interruptionLevel: "time-sensitive"`.

### iOS specific requirements

- **APNs key**: generate an APNs Auth Key (`.p8`) in the Apple Developer
  portal and configure it for Expo push (project settings). Without it, Expo
  cannot deliver to iOS.
- **Time-sensitive interruptions**: add the
  `com.apple.developer.usernotifications.time-sensitive` entitlement to the
  app's entitlements file. Expo config:
  ```jsonc
  {
    "ios": { "entitlements": {
      "com.apple.developer.usernotifications.time-sensitive": true
    } }
  }
  ```
- **Critical alerts** (optional, breaks through silent mode) need Apple
  approval for a `critical-alerts` entitlement — not required for v1.
- iOS suppresses/coalesces background notifications; time-sensitive level
  mitigates this. Test on a physical device — the simulator does not receive
  pushes.
- Users must grant notification permission — request it early (on first
  sign-in), and surface it again in Settings if denied.

### Android

- Expo handles FCM via the Android credentials in Expo project settings
  (a Google Service Account JSON).
- The app should create a high-priority notification channel for rings
  (heads-up display + full-screen intent for the incoming-ring UI).

---

## 3. Email (Resend)

1. Create a Resend account, add your domain, verify DNS.
2. Generate an API key → `RESEND_API_KEY`.
3. Create a "From" address (or use a shared domain like `onboarding@…`) →
   `EMAIL_FROM`.
4. Test by enabling email for ring/results in Settings.

Email is transactional only (ring alerts, results). No marketing email setup
is required for v1.

---

## 4. SMS (Vonage)

1. Create a **Vonage** account (developer.vonage.com), create an application,
   and note your **API key** and **API secret** → `VONAGE_API_KEY` /
   `VONAGE_API_SECRET`.
2. Buy a number or use an approved alphanumeric sender ID →
   `VONAGE_FROM_NUMBER`.
3. Users opt into SMS per-channel in Settings and must provide a full
   E.164 number (`+15550001234`).
4. **Compliance**: sending to US/CA numbers may require registration with the
   phone carrier's A2P rules (Vonage walks you through this during number
   purchase). Add an explicit opt-in consent line in the UI and mention it in
   the privacy policy.

---

## 5. In-app purchases (Phase 4)

- **Catalog** lives server-side (`packages/api/src/lib/catalog.ts`): point
  packs (500/$2.99, 1,200/$5.99, 3,500/$12.99) and a Time Shield 3-pack
  ($3.99). Cosmetics are reserved for later.
- The native app must use **Apple In-App Purchase** / **Google Play Billing**
  for all digital goods — this is a platform requirement.
- `purchases.validateReceipt` currently runs a **development validation** that
  accepts any non-empty transaction id. Before launch, implement the real
  server-side checks:

  **Apple** — use the App Store Server API (JWS-signed transactions). Add
  secrets: `APPSTORE_ISSUER_ID`, `APPSTORE_KEY_ID`, `APPSTORE_PRIVATE_KEY`,
  `APPSTORE_BUNDLE_ID`. Verify `transactionId` is unique and the product
  matches.

  **Google** — use the Play Developer API. Add secrets:
  `GOOGLE_PLAY_EMAIL` (service account), `GOOGLE_PLAY_PRIVATE_KEY`,
  `GOOGLE_PLAY_PACKAGE`. Verify `purchaseToken` and consume consumables.

- The `platformTransactionId` is the idempotency key — retried receipts can't
  double-grant.
- **Sandbox**: create test products in App Store Connect / Play Console with
  the exact `productId`s from the catalog before testing IAP.

---

## 6. Apple App Store submission

1. **Apple Developer Program** ($99/yr) + an **App Store Connect** app
   record.
2. **Privacy policy URL** — required. Cover: email/password auth, contacts
   (hashed matching), push notification data, purchase data, and the
   adults-only (17+) rating.
3. **Age rating**: use the App Store Connect questionnaire. For a 17+ rating
   the questionnaire will ask about gambling — answer honestly: there is **no
   real-money gambling**; purchases are fixed-price with no randomization
   (App Review Guideline 5.3.3). The recommended setup is adults-only.
4. **Screenshots & metadata**: 6.9″/6.5″ iPhone and iPad screenshots, app
   description, keywords, category **Games > Casual**.
5. **Build**: `eas build -p ios --profile production` (see
   `apps/native/app.json`; add the time-sensitive entitlement and
   notification permission strings).
6. **TestFlight** → TestFlight reviewers → App Review. Expect questions about
   the ring mechanics and the contacts permission — be explicit in the review
   notes about hashing and opt-in.

## 7. Google Play submission

1. **Play Console** + developer account ($25 one-time).
2. **Data safety form** — disclose contacts access, device identifiers for
   push, and purchases. Note hashing.
3. **Age rating** via the IARC questionnaire.
4. **Content policy**: no real-money gambling — point packs and consumables
   are standard freemium. The Play Console may ask about "Real-Money Gambling"
   — answer no; add the monetization disclosure that uses in-app purchases.
5. **Testing**: closed/internal test track → production.
6. **Build**: `eas build -p android --profile production`.

## 8. Web / PWA launch

1. The web app is installable (manifest + service worker + icons already
   configured in `apps/web/public`).
2. **HTTPS** is required for service workers and the install prompt —
   Cloudflare provides this automatically.
3. Add the web URL to Better Auth `trustedOrigins` if it's not covered by
   `CORS_ORIGIN`.
4. iOS Safari users install via **Share → Add to Home Screen** (no install
   prompt on iOS).

## 9. Pre-launch functional checklist

- [ ] `bun run check-types` passes (all workspaces).
- [ ] `bun run check` passes (lint).
- [ ] Migrations generated for all schema changes and applied to prod D1.
- [ ] Two real devices ring each other end-to-end: create → push → answer →
      points ledger update → leaderboard rank change.
- [ ] Ring expires with nobody answering → resolved as ditch, points applied,
      history shows "ditched".
- [ ] Contacts import matches a friend by phone hash (both directions).
- [ ] Invite link: logged-out user opens it → signs up → auto-friends.
- [ ] Email + SMS notification channels fire when secrets are set.
- [ ] Cooldown, DND, and daily loss cap behave as expected.
- [ ] Purchase grants points once; re-submitting the same transaction id is
      ignored.
- [ ] Web PWA installs and launches standalone; icons render.

## 10. Known follow-ups

- **Durable Objects**: the countdown is currently resolved by server timestamps
  on read/answer. A Cloudflare Durable Object per active ring (Alchemy's
  Effect-based API) can later provide proactive ditch notifications without
  waiting for the next read.
- **Facebook friend import**: deferred to v2.
- **Cosmetics**: catalog slot exists; add items + a native cosmetics screen.
- **Daily spend cap**: add a soft cap in `purchases.validateReceipt` for
  under-18 protection if the audience policy ever changes.
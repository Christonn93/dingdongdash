Implement a focused UX and visual-design overhaul for the ringing/door interaction and the Friends page in the existing React + TypeScript monorepo.

This terminal session cannot access screenshots. Treat the visual descriptions below as the source of truth.

Keep the existing DingDongDitch product identity:
- Playful neighborhood/doorbell social interaction.
- Warm coral primary actions.
- Deep purple-to-coral gradient surfaces.
- Cream/off-white and dark brown/near-black theme colors.
- Large rounded cards.
- Friendly but polished typography.
- Shared components from `packages/ui`, which contains the shadcn-based UI primitives.
- Existing routing, authentication, friend state, ringing logic, theme behavior, and responsive header behavior must continue to work.

Do not introduce a new UI library. Do not only make superficial CSS edits. Inspect the current state model, components, local assets, database/API types, and shared UI package before implementing.

# Product context

DingDongDitch is a playful social app where users add friends and can “ring” each other’s doorbells.

The key product loop is:
1. A user rings a friend.
2. The friend receives an incoming ring.
3. The recipient sees who is at their door and has a limited time to answer.
4. The recipient answers the door.
5. The app confirms or transitions into the existing connected/answered outcome.

The visual design must make this interaction immediately understandable. The user must be able to understand:
- Who is ringing.
- That the door is currently closed.
- What to tap/click.
- How much time remains.
- What happens after they answer.

# Scope

Implement three related improvements:

1. Rebuild/refine the incoming ringing door interaction.
2. Reorganize the Friends page around the user’s actual friends.
3. Build a reusable, persistent, fun local avatar system.

Before coding, inspect:
- Dashboard ringing card and all relevant ring-state components.
- Existing ring/domain state, API calls, mutations, timers, and event/subscription mechanisms.
- Friends route/page and its child components.
- Existing user/profile/friend data models.
- Shared `packages/ui` components and package exports.
- Local image/SVG/icon assets.
- Existing database schema, migrations, validation schemas, API contracts, and generated/shared types.
- Existing responsive layout patterns and Tailwind conventions.

Do not alter backend/domain behavior unless an avatar field must be persisted. Preserve working ring, friend, mute, invite, and authentication logic.

# Part 1 — Ringing and door interaction

## Current problem, described precisely

The dashboard has an incoming-ring state that currently looks visually unclear.

The current UI resembles an open doorway or partially exposed interior before the recipient interacts. This is misleading because the user has not answered yet.

The bell/action marker appears visually offset from the door area. It does not feel physically connected to a doorbell, door frame, or actual interaction target.

The current “tap the door” instruction is visually detached. It can look like text floating in the card rather than a direct affordance connected to the door.

The countdown/status content competes with the door, instead of supporting the main action.

The redesign must make the interaction feel like a real, compact, playful front-door moment.

## Required state model

Use the project’s existing ring/domain state if it already provides equivalent states. Do not duplicate backend state unnecessarily.

If the existing domain state does not map cleanly to the UI, create a small typed presentation-state mapping. For example:

```ts
type DoorVisualState =
  | "idle"
  | "incoming"
  | "opening"
  | "answered"
  | "expired";
```

Do not use `any`. Do not create a separate source of truth that conflicts with the actual ring status.

Implement the following visual and interaction states.

### State A: Idle — no incoming ring

This is the ordinary dashboard state when no one is ringing the user.

Visual content:
- Title: `No one's at the door right now`
- Supporting copy: `Give it a tap — the bell's for practice until a friend rings you.`
- A clearly visible bell interaction.
- Primary CTA: `Ring a friend`

Requirements:
- Do not show an incoming visitor or an open door.
- Do not imply someone is waiting.
- Maintain the existing purple-to-coral gradient card style.
- The layout must remain readable between 320px and 430px wide.
- The headline and description must have a normal readable max width. Never constrain them to a tiny narrow column.
- The bell must be centered or intentionally positioned, not floating accidentally.
- The CTA must be clearly separated from the bell and have comfortable tap-target sizing.

### State B: Incoming ring — waiting for response

This state occurs when a friend is ringing the user.

Example content:
- Status: `Christopher Tønnesland is at your door`
- Timer label: `12 seconds left`
- Main action: `Answer the door`

The exact visitor name and remaining seconds must use existing real data.

Required visual composition:
1. Visitor identity/status at the top.
2. Closed door as the main central visual and interaction target.
3. The answer CTA under or closely associated with the door.
4. Countdown as important secondary context, visible without competing with the door.

The visitor status should:
- Clearly identify the visitor.
- Use a selected avatar if available.
- Fall back safely to the existing polished initials avatar when no avatar exists.
- Not cover the door or reduce the available interaction area.

### Closed-door requirement

The door must be fully closed by default.

It must visually read as a stylized front door:
- A clear rectangular door slab.
- A visible door frame.
- A door edge or inset border.
- A handle/knob positioned near the opening edge.
- Optional subtle panels, peephole, mail slot, house number, or welcome detail only if it fits cleanly.
- Subtle depth through gradients and shadows.
- A playful but polished appearance, not photorealistic and not excessively skeuomorphic.

Important:
- Do not show a visible interior room.
- Do not show a dark doorway gap that makes the door look open.
- Do not use a generic floating rectangle that fails to read as a door.
- Do not use a remote image, remote SVG, stock image, or external asset URL.
- Do not create a huge fragile collection of arbitrary absolutely positioned elements.
- Prefer a dedicated reusable component with a maintainable structure.

### Doorbell and action alignment

The bell must visually belong to the door.

Choose one of these clear arrangements:
- Mount a small doorbell button on the wall/frame beside the closed door.
- Place the bell button on the door frame near the handle side.
- Integrate a subtle bell/doorbell symbol into a clearly labeled answer control close to the door.

Do not:
- Place the bell directly over the door handle.
- Put the bell in a random unrelated part of the gradient card.
- Make the bell look like a detached game token.
- Use a detached instruction such as “Tap the door” without anchoring it to the actual clickable door/button.

The actual answer interaction should be obvious:
- The door itself is clickable/tappable.
- A visible button with `Answer the door` is also provided.
- Both controls trigger the same existing answer action.
- The button should be the most discoverable fallback action.

### Semantic interaction and accessibility

The door must be a semantic interactive control, preferably a `<button>`.

Requirements:
- Use an accessible label such as:
  `Answer the door for Christopher Tønnesland`
- Include visible keyboard focus styles.
- Enter and Space must activate it.
- Disable it correctly if the ring expires or an answer request is currently pending.
- Avoid nested interactive controls.
- Do not make a non-semantic `<div>` clickable.
- Respect `prefers-reduced-motion`.

### State C: Opening and answered

Only after the user activates the existing answer action:
- Start an opening transition.
- The door should visually swing from its hinge edge rather than simply disappearing.
- A CSS transform such as `transform-origin` plus a modest `rotateY` is acceptable if it fits the existing stack and avoids visual glitches.
- Keep the transition quick and satisfying: approximately 200ms–400ms.
- For users with reduced motion enabled, reduce or remove the animated swing and transition directly to the answered state.
- Do not report success before the existing async answer action confirms successfully.
- While the answer request is pending, prevent duplicate activation and show existing pending feedback or a small appropriate loading indicator.

After a successful answer:
- Transition to the product’s existing answered/connected UI.
- If there is no existing final state, show a modest confirmation such as:
  - `You answered the door`
  - `You're connected with Christopher`
- Do not invent new backend behavior, chat behavior, points, rewards, or friend relationships.

### State D: Expired or missed ring

When the existing countdown reaches zero or the ring state changes to expired:
- Remove or disable the answer interaction.
- Clearly communicate the outcome, for example:
  - `You missed Christopher's ring`
  - `This ring has expired`
- Provide only actions already supported by the product, such as returning to the dashboard or ringing a friend.
- Do not imply that an expired ring was answered successfully.

## Recommended component boundary

Refactor toward a reusable door interaction component if it improves the current architecture.

The API can resemble this, but must follow the repository’s naming and type conventions:

```tsx
type DoorVisualState =
  | "idle"
  | "incoming"
  | "opening"
  | "answered"
  | "expired";

interface DoorInteractionProps {
  state: DoorVisualState;
  visitorName?: string;
  visitorAvatarId?: AvatarId | null;
  secondsRemaining?: number;
  onAnswer?: () => void | Promise<void>;
  isAnswering?: boolean;
  disabled?: boolean;
}
```

Avoid putting all domain logic into a presentation component. Keep the component focused on rendering and invoking existing callbacks.

## Responsive layout expectations

Mobile, 320px–430px:
- The card must fill the available content width with normal horizontal gutters.
- No text may wrap into one-word vertical columns.
- The door remains the central focal point.
- The door, visitor information, timer, and answer button must not overlap.
- Buttons have a minimum comfortable touch height, ideally around 44px or more.
- No horizontal page overflow.

Tablet and desktop:
- The card must use the existing dashboard layout and remain proportionate.
- Do not leave a tiny mobile-sized door/card stranded in a large desktop viewport.
- Use reasonable card max widths and responsive spacing.
- Do not let the door grow so much that it feels like a full-screen illustration.
- Ensure the visual hierarchy remains clear at 1024px, 1280px, and 1440px.

# Part 2 — Friends page hierarchy

## Current problem, described precisely

The current Friends page prioritizes secondary features above the actual friend list.

Its content order is currently similar to:
1. Large practice/ringing card.
2. Contact sync and invite cards.
3. Large empty requests and sent-invites panels.
4. “Your friends” list much lower on the page.

This is the wrong priority. A person visiting Friends should see who their friends are first.

## Required content order

Reorganize the Friends page into this order:

1. Page heading and concise supporting description.
2. `Your friends` section.
3. Incoming friend requests, only when there is at least one request.
4. Sent/pending invitations, only when there is at least one invitation.
5. Friend-discovery actions.
6. Practice/ringing content only at the bottom, if it remains on this page.

Use the existing route and data behavior. Do not alter friend relationships, mute behavior, invitations, contact syncing, or ring actions.

## Page heading

Use a compact, intentional header.

Suggested content:
- Title: `Friends`
- Description: `Ring your friends and grow your circle.`

Adapt wording to existing product copy if it already has an established voice.

The heading should:
- Be readable on mobile and desktop.
- Not consume excessive vertical space.
- Be followed immediately by the user’s friend list or appropriate empty state.

## Your friends section

The `Your friends` section must be the first primary content section after the page heading.

When the user has friends:
- Render the existing friends list near the top.
- Preserve working `Ring` and `Mute` behavior.
- Use clear, comfortable list rows.

Each friend row should include:
- Avatar.
- Friend name.
- Optional supporting detail only when meaningful, for example points, availability, muted status, or short activity status.
- Primary action: `Ring`.
- Secondary action: `Mute` only if it is already an existing feature and does not compete with `Ring`.

Mobile row behavior:
- Rows must be comfortably tappable.
- Avoid cramping several action buttons into a narrow row.
- Use wrapping or a composed row/footer pattern if necessary.
- The `Ring` button should remain visually primary.

Desktop row behavior:
- Keep rows readable and compact.
- Do not stretch every row into an oversized empty panel.
- Align avatars, names, metadata, and actions consistently.

When the user has no friends:
- Show a friendly empty state directly in the `Your friends` section.
- Use a small local visual such as a tasteful avatar grouping, doorbell-related illustration, or generated avatar examples.
- Do not require remote image assets.
- Use helpful copy such as:
  - `Your doorstep is quiet for now.`
  - `Invite someone or find friends from your contacts to start ringing.`
- Include clear actions:
  - Primary: `Invite a friend`
  - Secondary: `Find contacts` or the existing equivalent
- Do not bury this empty state under unrelated practice content.

## Requests and sent invitations

Incoming friend requests:
- Only render the section when there is at least one incoming request.
- Show a clear section title such as `Requests`.
- Preserve existing accept/decline behavior.
- Do not render an empty large bordered panel when count is zero.

Sent invitations:
- Only render when there are pending sent invitations.
- Use a section title such as `Sent invites`.
- Preserve existing invitation status and cancellation/copy/link behavior.
- Do not render empty placeholder panels unless they have a direct useful purpose.

## Friend discovery section

Place friend discovery after actual friend relationships and requests.

Use a section title such as:
- `Find more friends`

It may contain:
- Find friends from contacts.
- Invite a friend by link.
- Existing contact sync state/status.
- Existing invite flow.

Requirements:
- Keep actions functional.
- Clearly distinguish the primary action from secondary alternatives.
- Use responsive card/grid layout:
  - Mobile: stacked cards/actions.
  - Larger widths: two-column layout only if it improves readability and matches existing page conventions.
- Do not place the discovery section ahead of `Your friends`.

## Practice/ringing content

The ringing/practice card belongs primarily on Dashboard.

If it is kept on Friends:
- Place it at the bottom of the page.
- Make it clearly secondary.
- Use a smaller, less dominant treatment than the dashboard’s main ring card.
- Do not allow it to push the friends list below the fold.
- Do not duplicate complex ringing logic unnecessarily.

If the app’s product architecture supports removing it from Friends without losing functionality, prefer removing the large practice card from Friends and keeping the actual ringing experience on Dashboard.

# Part 3 — Reusable local avatar system

## Goal

Build a first-class reusable avatar system for the current user and friend records.

Users currently fall back to initials such as `CT`. Add optional, selectable, playful avatars that fit DingDongDitch’s doorbell/neighborhood identity.

This first version must not require photo upload.

## Visual direction

Create a curated collection of approximately 12–24 selectable avatars.

Good theme candidates include:
- Doorbell.
- House.
- Front door.
- Cat.
- Dog.
- Frog.
- Ghost.
- Alien.
- Robot.
- Mushroom.
- Pizza slice.
- Rubber duck.
- Cloud.
- Lightning bolt.
- Bee.
- Rocket.
- Plant.
- Mailbox.
- Raccoon.
- Wizard hat.

Use a coherent visual system:
- Simple local SVG or React SVG illustrations.
- Rounded friendly shapes.
- Bold silhouettes.
- Purple, coral, warm yellow, cream, dark brown, and compatible accent colors.
- Adequate contrast in both light and dark themes.
- Each choice should remain recognizable at small sizes such as 32px–48px.
- Options should look fun and distinct, but not childish or inconsistent.
- No copyrighted character art.
- No remote avatar service.
- No remote image URLs.
- Do not use raw OS emoji as the final avatar implementation because rendering differs across operating systems.

Implementation preference order:
1. Existing suitable local avatar/icon assets.
2. New local SVG files committed to the repository.
3. A typed React/SVG renderer mapping avatar IDs to local components.
4. Existing icon-library icons combined with themed backgrounds, only if the project already uses and licenses that icon library.

Do not generate an excessive number of separate random components if a typed, maintainable configuration map works better.

## Typed avatar model

Inspect the actual user/profile schema and API contracts.

Add a nullable avatar property using the project’s conventions. For example:

```ts
export const avatarIds = [
  "doorbell",
  "house",
  "cat",
  "dog",
  "frog",
  "ghost",
  "robot",
  "mushroom",
  "pizza",
  "duck",
  "cloud",
  "bee",
  "rocket",
  "mailbox",
  "raccoon",
  "wizard-hat",
] as const;

export type AvatarId = (typeof avatarIds)[number];
```

Then use the equivalent of:

```ts
interface UserProfile {
  // Existing fields...
  avatarId: AvatarId | null;
}
```

Adapt exact names and file locations to the repository.

Requirements:
- Existing users with no avatar must continue to work.
- Existing friend records with incomplete profile data must continue to work.
- New avatar field must be nullable.
- Do not break authentication, profile loading, friend lists, ring events, or user serialization.
- Avoid `any`.
- Add a persistent schema/database migration only if profiles are already persisted and the selected avatar must survive sessions/devices.
- If a migration is needed, update:
  - Database schema.
  - Migration files.
  - ORM types.
  - Input validation.
  - API contract/types.
  - Read queries.
  - Update mutation/action.
  - Client cache invalidation or state refresh as required.
- Validate avatar IDs using the explicit allowed union/list. Never accept arbitrary strings as avatar IDs.

## Shared avatar rendering

Create reusable avatar primitives in the appropriate shared location.

Suggested component structure, adapted to repository conventions:

```tsx
interface AppAvatarProps {
  avatarId?: AvatarId | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}
```

Behavior:
1. If `avatarId` exists and is valid, render its local visual avatar.
2. If it is missing or null, render the existing initials fallback improved to fit the product style.
3. If the name is missing, use a safe generic fallback without crashing.
4. Ensure visuals remain accessible:
   - Decorative avatar imagery should not create redundant screen-reader noise if adjacent accessible text provides the person’s name.
   - Where an avatar is used alone, provide useful `aria-label` or equivalent context.

Use the existing shadcn Avatar primitive from `packages/ui` if appropriate, but it is acceptable to create a small product-level avatar wrapper that uses it.

## Avatar selection UI

Add an avatar selector in the existing profile/account area.

Do not invent a new profile route if the product already has a Profile page or profile menu destination. Locate the existing profile settings/view and integrate there.

The selector should:
- Show the current selection.
- Show a visually organized grid of available avatar options.
- Make the selected option obvious through a border, ring, check indicator, or selected state.
- Use real accessible controls:
  - Prefer buttons or radio-group semantics.
  - Every option must have an accessible name, for example `Choose Cat avatar`.
  - Keyboard navigation must work.
- Include Save/Apply only if the existing profile form uses explicit saving.
- Otherwise persist immediately using the existing mutation pattern, with pending/error feedback.
- Ensure an avatar change updates:
  - Header/account area where relevant.
  - Friends list.
  - Incoming ring visitor display.
  - Any other profile display already based on user information.

Avoid a modal unless existing profile patterns use one. Prefer an inline profile-setting section or existing settings panel.

## Avatar sizes and responsive behavior

Ensure avatar rendering works at the following sizes:
- 24px–28px: compact header/list contexts.
- 32px–40px: friend list rows.
- 48px–64px: profile selection/current-user display.
- Larger only when it improves an empty state or door interaction.

No avatar may be clipped, pixelated, or misaligned in a circle/rounded container.

At narrow mobile widths:
- Avatar selection grid must fit with responsive columns.
- It should not cause horizontal page overflow.
- It should retain at least a practical touch target.
- Friend rows should not become crowded because of the avatar.

# Shared UI and architecture constraints

Use components from `packages/ui` where appropriate:
- Card.
- Button.
- Avatar primitive, if available.
- Tooltip.
- Dialog/Sheet only when there is a real existing use case.
- Skeleton/progress/loading components.
- Accessible form controls.

Do not duplicate shadcn primitives inside app packages if they already exist in `packages/ui`.

Preserve monorepo import conventions and package boundaries.

Do not:
- Add a new component library.
- Introduce remote assets.
- Change unrelated dashboard/header styling.
- Rework authentication.
- Replace working API/ring/friend behavior.
- Use hard-coded user names.
- Use hard-coded temporary friend/avatar data in production flows.
- Add arbitrary massive z-index values or brittle absolute positioning as a visual workaround.
- Break server/client component boundaries if this is a Next.js project.
- Add hydration mismatches through random avatar fallback generation.

For deterministic fallback avatar colors, derive them from a stable value such as user ID or normalized name, not `Math.random()` during render.

# File and component organization

Before adding files, inspect the repository structure and follow its conventions.

A likely good separation, only if it fits the codebase, is:
- Shared avatar types/config/renderers in a shared package or existing domain/UI location.
- Product-level `AppAvatar` wrapper in a shared components folder.
- Door presentation component near dashboard/ring UI.
- Ring state mapping near existing ring/domain hooks.
- Friends page composed from smaller existing or new section components.
- Avatar profile selection component near existing Profile/Settings UI.
- Database/API changes in the existing profile domain modules.

Keep components focused:
- Domain hooks/actions manage state and mutations.
- Presentational components render typed props.
- Shared avatar code does not depend on a specific page.
- Friend list does not own ring-domain business logic.
- Door component does not make hidden database assumptions.

# Validation requirements

Run the project’s available checks after implementation:
1. Typecheck.
2. Lint.
3. Relevant unit/integration tests.
4. Production build if practical.
5. Database migration validation/generation if a schema migration is required.

Manually inspect these viewport widths:
- 320px.
- 360px.
- 375px.
- 390px.
- 430px.
- 768px.
- 1024px.
- 1280px.
- 1440px.

Manually verify:

Door interaction:
- Idle state does not imply an incoming visitor.
- Incoming state shows a fully closed door.
- Door clearly looks like a door, including frame and handle.
- Bell is visually attached to the door/frame.
- Visitor identity, timer, door, and answer action do not overlap.
- Door and answer button both invoke the existing answer action.
- Door opens only after the interaction is activated.
- The opening motion respects reduced-motion preferences.
- Expired state cannot be answered.
- No horizontal overflow occurs.

Friends page:
- `Your friends` is immediately below the page heading.
- Existing friends display before discovery/promotion cards.
- Empty requests and empty sent-invites panels are not rendered.
- Discovery actions come after the friend list and active request/invitation sections.
- Practice/ringing UI is bottom-priority or removed from Friends if appropriate.
- Existing Ring and Mute actions work.
- Mobile rows remain usable.

Avatar system:
- Users without an avatar still render a safe initials fallback.
- Selected avatars persist if profile data is persisted.
- Invalid IDs cannot be submitted.
- Avatar updates appear everywhere relevant after mutation/update.
- Avatar selector is keyboard accessible.
- Light and dark themes have adequate contrast.
- No remote asset requests or browser-dependent emoji rendering are used.

# Output format

After implementing, provide:

1. A concise implementation summary.
2. The exact root cause(s) found in the current ringing UI and Friends-page hierarchy.
3. The user-state/ring-state mapping used for the door interaction.
4. Files created and modified, with the purpose of each.
5. Avatar IDs added and where the avatar configuration lives.
6. Any database migration/API/schema changes made.
7. Commands run and their results.
8. Any remaining caveats or intentionally deferred work.

Do not only describe the proposed solution. Inspect the repository and implement it.
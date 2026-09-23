# DingDongDitch decision map

The tables below convert the specification into an implementation map: who acts, what the server checks, what happens next, how points change, and which messages each user receives. The server must always decide the result; the mobile client only displays the current state. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Point rules

| Event | User A — ringer | User B — target | Ledger entries |
|---|---:|---:|---|
| User B opens before expiry | −5 | +10 | A: `catch -5`; B: `catch +10` |
| Timer expires before User B opens | +10 | −10 | A: `ditch_reward +10`; B: `ditch_penalty -10` |
| User B has no connection | +10 after expiry | −10 after expiry | Same as a normal ditch |
| Duplicate answer request | 0 | 0 | No new entries |
| Answer after expiry | 0 | 0 | Ring is already resolved as ditched |
| Blocked or non-friend target | 0 | 0 | Ring is not created |
| Rate limit or cooldown violation | 0 | 0 | Ring is not created |
| Purchase of points | 0 | 0 | Buyer: `purchase +N` |
| Signup | 0 | 0 | New user: `signup_bonus +100`, if enabled |

The exact points in the source specification are User B `+10` and User A `−5` for a catch, and User A `+10` and User B `−10` for a ditch. The specification also requires a rolling 24-hour loss floor, so the negative ledger entry should be reduced or skipped when the user has reached that floor. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Ring creation flow

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User A | Opens User B’s profile | Check that B exists and is active | Show the Ring button or an explanation | 0 | A: “You can ring this player.” |
| User A | Taps “Ring” | Check authentication | Continue validation | 0 | A: “Checking whether you can ring them…” |
| User A | Confirms the ring | Check accepted mutual friendship | Continue if friendship is valid | 0 | A: “Friendship confirmed.” |
| User A | Confirms the ring | Check whether A has blocked B or B has blocked A | Reject if blocked | 0 | A: “You cannot ring this player.” |
| User A | Confirms the ring | Check same-target cooldown | Reject if cooldown is active | 0 | A: “You can ring this player again in 42 minutes.” |
| User A | Confirms the ring | Check global rate limit | Reject if A has rung too many people | 0 | A: “You have reached your ring limit. Try again later.” |
| User A | Confirms the ring | Check whether A is allowed to play | Reject suspended, deleted, or restricted accounts | 0 | A: “Your account cannot create rings right now.” |
| User A | Confirms the ring | Create the ring transactionally | Create a pending ring with server timestamps | 0 | A: “Ring sent!” |
| Backend | Creates the ring | Set `createdAt`, `expiresAt`, and `status = pending` | Start the authoritative timer | 0 | Internal event: `ring.created` |
| Backend | Sends notification | Send push notification to B’s registered devices | Show incoming-ring UI if delivery succeeds | 0 | B: “Someone is at your door!” |
| Backend | Push delivery fails | Keep the ring active anyway | Timer still resolves the ring normally | 0 | Internal: “Notification delivery failed.” |

The ring should only be created after the friendship, block, cooldown, rate-limit, and account-status checks pass. The ring’s `expiresAt` must be calculated by the backend, not by the client. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Main gameplay flow

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User B | Receives the notification | Look up the pending ring | Display the incoming-ring screen | 0 | B: “Someone rang your door.” |
| User B | Opens the incoming-ring screen | Fetch the current ring state | Show remaining server-calculated time | 0 | B: “You have 18 seconds left.” |
| User B | Taps “Open Door” before expiry | Lock the ring and compare server time with `expiresAt` | Resolve as `caught` | A −5 / B +10 | A: “You got caught!” B: “You caught them!” |
| User B | Taps “Open Door” after expiry | Detect that the ring has expired | Resolve or return the existing `ditched` result | A +10 / B −10 | B: “You were too late.” |
| Backend | Timer reaches expiry | Atomically resolve only if status is still `pending` | Resolve as `ditched` | A +10 / B −10 | A: “You got away!” B: “Someone ditched you.” |
| User A | Opens the result screen | Fetch the resolved ring | Show the final result and balances | Depends on outcome | A: Show outcome and new point total |
| User B | Opens the result screen | Fetch the resolved ring | Show the final result and balances | Depends on outcome | B: Show outcome and new point total |

## Catch outcome

| User | Action | Condition | After action | Points | Message |
|---|---|---|---|---|---|
| User B | Taps “Open Door” | `status = pending` and server time `< expiresAt` | Set status to `caught` | A −5 / B +10 | B: “You caught User A!” |
| User B | Taps “Open Door” | A’s loss floor has been reached | Set status to `caught` | A 0 / B +10 | A: “You were caught, but no points were deducted because you reached your daily loss limit.” |
| Backend | Resolves catch | Ledger transaction succeeds | Update cached balances and leaderboard data | As calculated | A: “User B caught you.” |
| Backend | Resolves catch | Ledger transaction fails | Keep the ring unresolved or retry safely | 0 until successful | Internal: “Catch settlement pending.” |
| User A | Requests ring status | Ring is `caught` | Show the final result | A −5 | A: “You got caught by User B.” |
| User B | Requests ring status | Ring is `caught` | Show the final result | B +10 | B: “You caught User A.” |

A catch should be settled atomically. The system should prevent two simultaneous answer requests or a timer callback from awarding points twice.

## Ditch outcome

| User | Action | Condition | After action | Points | Message |
|---|---|---|---|---|---|
| Backend | Timer reaches `expiresAt` | Ring is still `pending` | Set status to `ditched` | A +10 / B −10 | Internal: “Ring expired.” |
| User B | Does nothing | Timer expires | Resolve as `ditched` | B −10 | B: “Someone ditched you.” |
| User A | Waits for result | Timer expires | Show successful ditch | A +10 | A: “You got away!” |
| User B | Has no internet | Timer expires on server | Resolve as `ditched` anyway | B −10 | B sees the result after reconnecting |
| User B | Reconnects later | Server returns `ditched` ring | Display historical result, without applying points again | 0 additional | B: “This ring expired while you were offline.” |
| User B | Opens after expiry but before sync | Server sees `status = ditched` | Return existing result | 0 additional | B: “You were too late. User A got away.” |
| User A | Requests status after expiry | Ring is `ditched` | Display successful ditch | A +10 | A: “You got away!” |

The timer callback and the answer endpoint must both use an atomic state transition such as `pending → caught` or `pending → ditched`. Only the first successful transition may create ledger entries. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Server decision tree

```text
User A taps Ring
        |
        v
Is User A authenticated?
        |
   No --+--> Reject: "Please sign in."
        |
       Yes
        |
        v
Are A and B accepted mutual friends?
        |
   No --+--> Reject: "You can only ring accepted friends."
        |
       Yes
        |
        v
Is either user blocked?
        |
  Yes --+--> Reject: "You cannot ring this player."
        |
        No
        |
        v
Is the target inside the cooldown period?
        |
  Yes --+--> Reject: "You must wait before ringing this player again."
        |
        No
        |
        v
Has User A exceeded the rate limit?
        |
  Yes --+--> Reject: "You have reached your ring limit."
        |
        No
        |
        v
Create Ring(status = pending)
        |
        v
Set authoritative expiresAt
        |
        v
Send push notification to User B
        |
        v
Return pending ring to User A
```

When User B answers:

```text
User B taps Open Door
        |
        v
Does the ring exist?
        |
   No --+--> Error: "Ring not found."
        |
       Yes
        |
        v
Is the ring already resolved?
        |
  Yes --+--> Return existing result; award nothing
        |
        No
        |
        v
Is server time before expiresAt?
        |
       Yes
        |
        v
Atomically change pending → caught
        |
        v
Write catch ledger entries
        |
        v
Notify both users
```

If server time is equal to or later than `expiresAt`, the server should resolve the ring as ditched instead of caught. This prevents client clock manipulation and makes the result consistent across devices. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Concurrent rings

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User B | Is answering Ring 1 | Ring 2 arrives | Keep both rings independent | No immediate change | B: “Another player is at your door.” |
| User B | Answers Ring 1 | Ring 1 is still pending | Resolve Ring 1 as caught | Ring 1 points apply | B: “You caught User A.” |
| User B | Ignores Ring 2 | Ring 2 reaches expiry | Resolve Ring 2 as ditched | Ring 2 points apply | B: “Someone else ditched you.” |
| User B | Opens active-rings list | Multiple pending rings exist | Show each countdown separately | 0 | B: “You have 2 active rings.” |
| User B | Answers one ring | Other rings remain pending | Continue their independent timers | 0 | B: “One door opened. Another is still ringing.” |

The specification explicitly allows concurrent incoming rings, so each ring should have its own ID, expiry timestamp, timer, and settlement transaction. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Time Shield flow

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User B | Purchases a Time Shield | Validate the platform receipt server-side | Add one shield to B’s inventory | Purchase item | B: “Time Shield added.” |
| User B | Arms the shield | Check that B owns an unused shield | Mark the shield as armed | 0 | B: “Your next incoming ring gets 15 extra seconds.” |
| User A | Rings User B | Check B’s armed shield | Add shield duration before setting `expiresAt` | 0 | A: “Ring sent!” B: “Someone is at your door — extended time.” |
| Backend | Applies shield | Consume exactly one shield | Set `expiresAt = baseExpiry + extension` | 0 | Internal: `time_shield.consumed` |
| User B | Tries to use a shield after ringing starts | Reject reactive use if that is the selected rule | Keep the original expiry | 0 | B: “Time Shields must be armed before someone rings you.” |
| User B | Has no shield armed | Use the default duration | Keep the standard countdown | 0 | B: “You have 30 seconds.” |

The specification recommends requiring the shield to be armed before the ring begins rather than allowing a user to purchase a rescue after the countdown has started. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Points and loss-floor decisions

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User A | Loses 5 points from a catch | Calculate A’s eligible 24-hour losses | Apply the permitted amount | A −5 or less | A: “You lost 5 points.” |
| User B | Loses 10 points from a ditch | Calculate B’s eligible 24-hour losses | Apply the permitted amount | B −10 or less | B: “You lost 10 points.” |
| User B | Has reached the loss floor | Suppress or reduce the penalty | Resolve ring without exceeding the floor | B 0 or reduced loss | B: “Your daily loss protection prevented more point loss.” |
| User A | Has exactly 3 eligible loss points remaining | Apply only 3 points | Keep the rest protected | A −3 | A: “You lost 3 points. Daily loss protection prevented 2 more.” |
| Any user | Has a zero or negative balance | Apply the configured product rule | Keep the ledger authoritative | Depends on rule | Show the resulting balance clearly |
| Any user | Opens the leaderboard | Read the current balance or snapshot | Display the new rank after settlement | 0 | “Leaderboard updated.” |

A good implementation choice is to make the loss floor a configurable policy rather than embedding it in the ring logic. That allows you to change the rules later without rewriting the settlement flow.

## Friend and safety decisions

| User | Action | Server decision | After action | Points | Message |
|---|---|---|---|---|---|
| User A | Sends a friend request | Check that B exists and is not blocked | Create pending friendship | 0 | A: “Friend request sent.” |
| User B | Accepts request | Create or update the reciprocal accepted relationship | Ringing becomes available | 0 | B: “You are now friends with User A.” |
| User B | Rejects request | Mark or remove the request | Ringing remains unavailable | 0 | A: “Your friend request was declined.” |
| User B | Blocks User A | Disable friendship and all ringing between them | Cancel or invalidate eligible future rings | 0 | B: “User A has been blocked.” |
| User B | Mutes User A | Keep the friendship but suppress notifications | Rings follow the selected mute policy | 0 | B: “Notifications from User A are muted.” |
| User B | Enables quiet hours | Queue or block incoming rings during the configured window | Prevent forced losses during quiet hours | 0 | B: “Quiet hours are active.” |
| User A | Rings too frequently | Apply target cooldown | Do not create a ring | 0 | A: “This player is on cooldown.” |
| User A | Repeatedly targets many users | Apply global rate limit | Temporarily disable ring creation | 0 | A: “You are temporarily rate-limited.” |

The specification calls for mutual opt-in, target cooldowns, quiet hours, mute/block functionality, and a fair daily loss cap because the notification mechanic could otherwise become a harassment vector. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Purchase decision map

| User | Action | Server decision | After action | Points/items | Message |
|---|---|---|---|---|---|
| User A | Opens the shop | Load catalog from the backend | Display current products and prices | 0 | A: “Choose a point pack or item.” |
| User A | Starts a purchase | Let Apple or Google process payment | Wait for platform result | 0 | A: “Processing purchase…” |
| User A | Purchase succeeds on device | Send receipt to backend | Backend validates the receipt | 0 until validation | A: “Verifying purchase…” |
| Backend | Validates receipt | Confirm transaction with Apple or Google | Grant the product once | Product-dependent | A: “Purchase verified.” |
| Backend | Sees known transaction ID | Treat request as an idempotent retry | Do not grant twice | 0 additional | A: “This purchase was already applied.” |
| Backend | Receipt validation fails | Reject the grant | Keep balance unchanged | 0 | A: “We could not verify this purchase.” |
| Backend | Receipt is refunded or revoked | Apply the configured reversal policy | Record an adjustment if required | Depends on policy | A: “A purchase adjustment was applied.” |
| User A | Buys a point pack | Grant fixed points after validation | Add a purchase ledger entry | A +N | A: “You received N points.” |
| User A | Buys cosmetics | Grant the cosmetic after validation | Add cosmetic to inventory | 0 | A: “Cosmetic unlocked.” |

Every purchase should be validated server-side, and `platformTransactionId` should be unique so retries cannot double-grant points or items. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/150719881/ec5362bf-9488-496c-b4b3-c04dd755c973/dingdongditch-spec.md?AWSAccessKeyId=ASIA2F3EMEYEQOEKLUEV&Signature=K9mOrC5vRywcgsE4kLfnmpysnwM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCYqUYkZy8KJg0ck7ETIUE7CvdCvUuaW5GRcCd%2FWnx4UQIgBhX%2BzEtVtYHx3q39sFxqrz8k6Az708DwH0Rk2Pj0hYwq%2FAQIuf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDKBxGD6ZPCQ0tfoziirQBLLXpsODeD%2FTe65Z0Rt6fQOjf1fph3RdC%2Bx25YT7FXyDWLZg9KUcr4UCBfKE7iuw9V5L8o0PnOeHwt9uwhraXm7IFu1TMDjDB3rJEdV9pTgIpHBlAWPYDa%2BZAhah4HbDyYeW4IzyTEJEUEV%2Bbj5JZCGGZgFWEkC0nk52Ok%2BBEG%2BAILdiuCOVnOdi50TGNTUvLzkku29refgdtvmKooAg6EVGNo665VkqXd6AkdC695Jp34dAgCKT6RTUYX0InKoTXDiOK6Ih4wKfXt%2BZQN7EI17Boz4iGfa3vGds2iw8ydrtWU2Oi5Umit4t0xPIl7HbwXu4%2FmCtxKnqjVxGLuQWUnlkm8nvrPnaCtQMZpRR%2Fv8Vt4ZnmL58Q%2BFN5PXD9gLD%2BWucVPHsWD2P25ksxKhjbx5%2Bj5AfhFb2uGtecpiOigw50drO36f5FOEYujZlAo0FLLx2IMyVc4aIyJultb104tiw4tqBUx3mRmsBSVNjFTx7s6%2BVaeWxeWqN697UGcwseerjT5%2B9woGT%2FcH7plHdGSobpQr5sxSoQlFBi4UI43wGXxLMIXp22GJkJYp6bvhtKx1lUyLUCpXM5wWS1hJzNf6WRBj63O%2FD9RqiE2nduZROshMnsqjBhueROsNrMHL2xzhXVW%2BJppxJrMDwLSHQ2h1KaOlQzjOrrckZyhdUO412OMHR4VbDPponWVvdwLCwwZnWjP%2B3eLhXuZuuHEVxa9NN7LTHmQPi8gCazm7hBKPQ%2Fae506vh66swQUE8jSZ0ZXMWGujuiVH0WEBKS1ieO1EwkpnO1QY6mAE5IFARqm3CG8OEhQp9c%2B%2BM8%2FMTL1vm1xOBzCSE7ZHtrDpHDqQrRGeIuMW4tZShnruj3GRZM3oleRiL9rJjQcD9rwq8maV1aU3eAl4CCa03LwOYC%2FPdDm5s7Do39EjgmFoUbZAhe%2FYnm2SLKPLMhSVTmSa4CWzK6TyfYiyJEJWpHU5syOhiW%2B5Y5O99vLae6p9xrAdxPlGBQA%3D%3D&Expires=1790155365)

## Recommended ring state machine

```text
                ┌────────────────────┐
                │      PENDING       │
                └─────────┬──────────┘
                          │
             ┌────────────┴────────────┐
             │                         │
             │ answer before expiry    │ timer reaches expiry
             │                         │
             v                         v
     ┌────────────────┐        ┌────────────────┐
     │     CAUGHT     │        │    DITCHED     │
     └────────────────┘        └────────────────┘
             │                         │
             └────────────┬────────────┘
                          │
                          v
                    Result shown
```

Allowed transitions:

| Current status | Event | New status | Can points be awarded? |
|---|---|---|---|
| `pending` | Valid answer before expiry | `caught` | Yes, once |
| `pending` | Timer expiry | `ditched` | Yes, once |
| `pending` | Answer after expiry | `ditched` | Yes, only if expiry settlement has not already happened |
| `caught` | Any repeated request | `caught` | No |
| `ditched` | Any repeated request | `ditched` | No |
| `caught` | Timer callback | `caught` | No |
| `ditched` | Answer request | `ditched` | No |

For production, it is useful to add an explicit `settlementStatus` such as `unsettled`, `settling`, or `settled`. That separates the ring outcome from the financial-style ledger transaction and makes retries easier to reason about.

## Message catalog

| Message key | Recipient | Suggested message |
|---|---|---|
| `ring.sent` | User A | “Ring sent to User B!” |
| `ring.incoming` | User B | “Someone is at your door!” |
| `ring.countdown` | User B | “You have {seconds} seconds to answer.” |
| `ring.caught.ringer` | User A | “You got caught by User B!” |
| `ring.caught.target` | User B | “You caught User A!” |
| `ring.ditched.ringer` | User A | “You got away!” |
| `ring.ditched.target` | User B | “Someone ditched you.” |
| `ring.tooLate` | User B | “You were too late. User A got away.” |
| `ring.offlineResult` | User B | “This ring expired while you were offline.” |
| `ring.cooldown` | User A | “You can ring User B again in {time}.” |
| `ring.notFriends` | User A | “You can only ring accepted friends.” |
| `ring.blocked` | Either user | “You cannot ring this player.” |
| `ring.rateLimited` | User A | “You have reached your ring limit.” |
| `points.gained` | Any user | “You gained {amount} points.” |
| `points.lost` | Any user | “You lost {amount} points.” |
| `points.lossProtected` | Any user | “Daily loss protection reduced your penalty.” |
| `purchase.verified` | Buyer | “Purchase verified. {item} added.” |
| `purchase.duplicate` | Buyer | “This purchase was already applied.” |
| `purchase.failed` | Buyer | “We could not verify this purchase.” |
| `shield.armed` | User B | “Your next ring gets extra time.” |
| `shield.rejected` | User B | “Time Shields must be armed before someone rings you.” |

## Suggested implementation order

1. Implement the `Ring` state machine with `pending`, `caught`, and `ditched`.

2. Implement one transactional settlement function used by both the answer endpoint and the expiry callback.

3. Add append-only ledger entries and calculate the effective penalty through a separate loss-floor policy.

4. Add notifications and result messages after the core state transitions are idempotent.

5. Add friendship checks, cooldowns, rate limits, blocking, muting, and quiet hours before inviting external testers.

6. Add purchases only after the free gameplay loop is reliable and receipt validation is server-side.

The most important invariant is: **one ring can produce only one final outcome and one set of ledger entries**. This protects against duplicate taps, delayed notifications, offline reconnection, timer retries, and concurrent requests.
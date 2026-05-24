# Community Economy Design

This document captures the design of KidPlayAI's community + coin economy. It is the source of truth for how kids earn and spend coins, how crafts get published and engaged with, and how the anti-abuse and quality-signal rules work.

## Goals

- Reward kids for **shipping** and for making things **other kids love**, not for grinding the AI.
- Make the discover surface a **free** social space (no paywalls on viewing).
- Keep DeepSeek cost bounded — the economy must self-regulate against runaway spend.
- Stay safe for 8–12 year olds: no gambling, no scarcity timers, no peer-to-peer payments, no real-money proxies.

## Core Concepts

- **Craft** — a sandbox owned by a student. Every sandbox is a craft-in-progress; publishing makes it visible in Discover.
- **Publish** — flips a sandbox from private to public. Once published, anyone signed in can view, play, like, and fork it. Unpublishing hides it again but doesn't undo prior engagement.
- **Discover** — the public surface where signed-in kids browse published crafts. Free to use; no coin gating. (Note: the existing `gallery` table is for student cohorts and is unrelated to Discover.)
- **Play** — opens a published craft full-screen. The first time a viewer plays a given craft, it counts as a unique play.
- **Like** — explicit "I like this" signal from a viewer. One per viewer per craft.
- **Fork** — creates a new sandbox for the forker, seeded with the source craft's `index.html`. The forked sandbox carries a `forked_from_sandbox_id` link so lineage is recoverable.
- **Coins** — single platform currency. Earned through publishing + engagement; spent on personal creative capacity (extra AI turns, templates, visibility boosts, cosmetics). Never traded between users.
- **Coin ledger** — every earn and spend is a row in `coin_ledger`. Balance is `sum(delta)` for the user. Idempotency keys prevent double-payouts.

## Pointing Algorithm

### Earning

**One-time bounties (onboarding + shipping nudge)**

| Action | Coins | Notes |
|---|---|---|
| First-ever publish on the account | 500 | Lifetime, once. Idempotency key: `first_publish:<user_id>` |
| Per-craft publish bounty | 100 | Once per craft. Cap: only the first 3 publishes per user per week earn this; further publishes go live but pay nothing. Idempotency key: `publish:<sandbox_id>` |
| Featured by admin/algorithm | 500 | Curation reward. Idempotency key: `featured:<sandbox_id>:<period>` |

**Recurring engagement (the main coin tap — quality dominates)**

| Action | Coins | Cap per craft per day |
|---|---|---|
| Unique play by another kid | 2 | 50 plays/day → 100 coins/day |
| Like by another kid | 10 | 20 likes/day → 200 coins/day |
| Fork by another kid | 200 | 10 forks/day → 2000 coins/day |
| Descendant publish (fork-of-fork chain) | 50 to root, decayed by depth | Up to depth 3 |

### Spending sinks

| Item | Coins | Notes |
|---|---|---|
| 1 extra AI turn (beyond 20/day free quota) | 5 | The main sink; self-regulates the economy against DeepSeek cost |
| Premium template/theme | 300 | Catalogue TBD |
| 24h Discover boost (pinned in feed) | 500 | At most one active boost per craft |
| Cosmetic profile flair | 100–200 | Avatar borders, accent colors, etc. |
| Custom craft cover image | 50 | One-off upload |

### Worked examples

**Kid publishes their first craft**
- Day 1: 500 (first-ever) + 100 (publish bounty) = **600 coins**
- Week 1 engagement: 30 plays + 8 likes + 1 fork = 60 + 80 + 200 = **340 coins**
- **Week 1 total: ~940 coins** — about 188 extra AI turns, or a premium template + 2 boost days.

**A craft that really lands**
- Caps hit: 100 plays over 2 days (50/day cap) + 50 likes over 3 days (20/day cap) + 5 forks
- 200 (plays) + 500 (likes) + 1000 (forks) = **1700 coins from engagement alone**

### Why these ratios

- **Fork ≫ like ≫ play (200 : 10 : 2)** matches signal strength. Fork = "I want to build on this." Like = "I appreciate this." Play = "I clicked it."
- **Publish bounty (100) < a strong day of likes (200)** — engagement dominates shipping volume, so kids can't out-earn quality just by spinning up sandboxes.
- **Fork bounty (200) > publish bounty (100)** — getting forked is the strongest detectable quality signal, so it pays more than just shipping.
- **First-ever publish (500)** preserves the "wow, I just earned coins!" onboarding hit without making it farmable.

## Anti-Abuse Rules

These are non-negotiable. The economy collapses without them.

- **Self-actions never count.** A kid's own plays, likes, and forks of their own craft pay zero coins.
- **Eligibility filter.** Plays, likes, and forks only earn coins when the *viewer* is an account that is:
  1. older than 24 hours, AND
  2. has at least one published craft of their own.
  
  This kills sock-puppet farms cheaply. Brand-new accounts can browse and play; they just don't pay anyone yet.
- **Daily caps per craft.** As listed in the earning table above. One viral hit can't fund a kid forever.
- **Engagement decay.** Actions on a craft pay full coins for 30 days after publish, 50% from days 30–90, and 25% beyond 90 days. Keeps the economy circulating to fresh work.
- **Publish bounty cap.** Only the first 3 publishes per user per week earn the per-craft bounty. Further publishes go live but pay nothing.
- **Idempotency.** Every bounty has a stable idempotency key (see earning table). Replay-safe: re-running a grant produces no double-payout.
- **One-time per craft.** Per-craft publish bounty, like, and play are all idempotent on `(sandbox_id, viewer_user_id)` (or `(sandbox_id)` for the bounty). Unliking and re-liking does not re-pay.

## Fork Lineage

- Forking creates a new sandbox owned by the forker, with `forked_from_sandbox_id` set to the source.
- Forks can chain: A → B → C → D, etc.
- When sandbox X is published, we walk the chain via `forked_from_sandbox_id`:
  - Depth-1 ancestor: pay 50 coins
  - Depth-2 ancestor: pay 25 coins
  - Depth-3 ancestor: pay 12 coins
  - Beyond depth 3: no payout
- Each ancestor publish bonus is idempotent on `(sandbox_id, descendant_sandbox_id)` to prevent double-grant on republish.
- The Discover UI shows "Forked from [original]" attribution on derived crafts.

## Data Model

### Sandbox extensions

Added to the existing `sandbox` table:

- `forked_from_sandbox_id` (uuid, FK → `sandbox.id`, nullable) — null on originals, set on forks
- `published_at` (timestamp, nullable) — current public state; null means private
- `publish_bounty_paid_at` (timestamp, nullable) — set once on the first publish; never reset. Used to enforce the once-per-craft publish bounty.

### New tables

- `craft_like` — `(sandbox_id, viewer_user_id)` unique. Single row per viewer per craft.
- `craft_play` — `(sandbox_id, viewer_user_id)` unique. Records the first unique play by each viewer (subsequent plays don't insert).
- `coin_ledger` — append-only ledger of all earns and spends. Balance is computed by `sum(delta) WHERE user_id = $1`.

All three tables use UUID PKs and `created_at` timestamps. See [db-schema.md](db-schema.md) for full column definitions.

### Why a ledger and not a balance column

- **Auditability** — every coin movement has a row with a reason, idempotency key, and reference to the triggering sandbox/user.
- **Replay safety** — idempotency keys make grants safe to retry without double-paying.
- **Reversibility** — admin adjustments are just negative-delta rows; no UPDATE on a balance.
- **Cost** — sum is cheap with an index on `user_id`; if it ever isn't, a denormalized cache can be added later.

## API Surface (planned for Phase 2)

All endpoints sit under `/api/`. Auth required unless noted.

### Publishing

- `POST /api/sandbox/:id/publish` — flips a sandbox public; grants the publish bounty (if eligible) and walks the fork chain to pay ancestors.
- `POST /api/sandbox/:id/unpublish` — hides from Discover; does not refund coins, does not delete engagement.

### Discover

- `GET /api/discover` — paginated feed of published crafts. Sortable by recent, most-liked, most-forked. Public — no auth (kids browsing without an account see a play-only view; engagement actions are gated by auth).
- `GET /api/discover/:sandboxId` — single craft detail incl. owner, like/play/fork counts, fork lineage.

### Engagement

- `POST /api/craft/:id/play` — records a unique play (idempotent per viewer); grants the play bounty if the viewer is eligible.
- `POST /api/craft/:id/like` — toggles like state. First like grants the bounty (subject to daily cap); unliking removes the row but does not refund.
- `POST /api/craft/:id/fork` — creates a new sandbox owned by the caller, seeded with the source's `index.html`. Grants the fork bounty to the source owner; sets `forked_from_sandbox_id`.

### Coins

- `GET /api/me/coins` — current balance + recent ledger entries.
- `POST /api/me/spend/turn-pack` — purchase extra AI turns. Server-side debits and credits the daily quota.
- `POST /api/me/spend/boost` — pin a craft in Discover for 24h.
- `POST /api/me/spend/template` — unlock a premium template for use in future crafts.
- `POST /api/me/spend/cosmetic` — buy a cosmetic item.

### Admin

- `GET /api/admin/coin-ledger?userId=` — full ledger view per user.
- `POST /api/admin/coin-adjust` — manual coin grant or claw-back, recorded with `reason = "admin_adjust"`.
- `POST /api/admin/craft/:id/feature` — flag a craft as featured; grants the 500-coin curation bounty.

### WebSocket events

- `me_coins_updated` — pushed to the owner whenever their balance changes. Lets the coin balance UI update without polling.

## Phasing

- **Phase 1 (current):** Design doc + DB schema + migration + doc updates. No runtime behavior changes.
- **Phase 2:** Backend routes + coin-granting logic + WebSocket coin updates + AI turn quota wiring.
- **Phase 3:** Frontend — Discover page, like/fork/play buttons, coin balance display, spending UI.
- **Phase 4:** Catalogues (templates, cosmetics, boost mechanics) and admin tooling.

## Open Questions

- **AI turn quota tracking.** Where is the daily free quota counted? Options: (a) a `daily_turn_count` table keyed on `(user_id, date)`; (b) compute from `session_message` count on the fly. (a) is cleaner once we add spending.
- **Boost ranking.** What's the exact formula for Discover ranking, and how strong is a boost? Needs design before Phase 4.
- **Template/cosmetic catalogue.** Out of scope until Phase 4.
- **Moderation.** Published crafts may need admin review before they hit Discover. Decided in Phase 2.

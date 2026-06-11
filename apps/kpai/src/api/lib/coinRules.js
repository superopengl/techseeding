// Coin economy constants and rule helpers. The full design is in
// docs/community-design.md — keep that doc and this file in sync.

// Base coin rewards per action. Engagement rewards decay over time
// (see engagementDecayMultiplier); one-time bounties do not decay.
export const COIN_REWARDS = {
  first_publish: 500,
  publish: 100,
  play: 2,
  like: 10,
  fork: 200,
  featured: 500,
};

// Per-craft daily caps on engagement bounties. Once a craft hits its
// daily limit for a given reason, further engagement of that kind that
// day pays zero — but the engagement row is still recorded.
export const DAILY_CAPS_PER_CRAFT = {
  play: 50,
  like: 20,
  fork: 10,
};

// The per-craft publish bounty is paid only for the first N publishes
// per user per week. Further publishes go live but pay nothing.
export const WEEKLY_PUBLISH_BOUNTY_CAP_PER_USER = 3;

// Descendant-publish bonus: when a fork is published, ancestors up to
// depth 3 earn this many coins.
export const DESCENDANT_PUBLISH_REWARDS = { 1: 50, 2: 25, 3: 12 };
export const DESCENDANT_PUBLISH_MAX_DEPTH = 3;

// Account-age threshold for engagement-coin eligibility. Brand-new
// accounts can browse but don't yet pay coins to creators.
export const ELIGIBLE_VIEWER_MIN_AGE_MS = 24 * 60 * 60 * 1000;

// Engagement decay multiplier based on time since the craft's first
// publish. Keeps the economy circulating to fresh work.
export function engagementDecayMultiplier(firstPublishedAt) {
  if (!firstPublishedAt) return 1;
  const days = (Date.now() - new Date(firstPublishedAt).getTime()) / 86_400_000;
  if (days < 30) return 1;
  if (days < 90) return 0.5;
  return 0.25;
}

// Compute the actual coin reward for an engagement event. One-time
// bounties (first_publish, publish, featured) are returned as-is;
// recurring engagement is multiplied by the decay factor and floored at 1.
export function computeReward(reason, firstPublishedAt) {
  const base = COIN_REWARDS[reason];
  if (typeof base !== "number") return 0;
  if (reason === "first_publish" || reason === "publish" || reason === "featured") return base;
  return Math.max(1, Math.round(base * engagementDecayMultiplier(firstPublishedAt)));
}

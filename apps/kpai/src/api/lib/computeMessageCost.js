// DeepSeek standard (non-discount) pricing in USD per 1M tokens.
// https://api-docs.deepseek.com/quick_start/pricing
const PRICING = {
  "deepseek-chat": {
    inputCacheMiss: 0.27,
    inputCacheHit: 0.07,
    output: 1.10,
  },
  "deepseek-reasoner": {
    inputCacheMiss: 0.55,
    inputCacheHit: 0.14,
    output: 2.19,
  },
};

const PER_MILLION = 1_000_000;

export default function computeMessageCost({
  modelId,
  inputTokens = 0,
  outputTokens = 0,
  reasoningTokens = 0,
  cacheReadTokens = 0,
}) {
  const prices = PRICING[modelId];
  if (!prices) return "0";

  // DeepSeek reports `prompt_tokens` (total) and `prompt_cache_hit_tokens`
  // (subset). The Vercel AI SDK surfaces them as `inputTokens` and
  // `cachedInputTokens` with the same total/subset relationship, so the
  // un-cached portion is the difference.
  const cachedInput = Math.max(0, cacheReadTokens);
  const uncachedInput = Math.max(0, inputTokens - cachedInput);
  // Reasoning tokens are split out of completion_tokens by the SDK but billed
  // at the same output rate by DeepSeek.
  const billedOutput = Math.max(0, outputTokens) + Math.max(0, reasoningTokens);

  const total =
    (uncachedInput * prices.inputCacheMiss) / PER_MILLION +
    (cachedInput * prices.inputCacheHit) / PER_MILLION +
    (billedOutput * prices.output) / PER_MILLION;

  return total.toFixed(6);
}

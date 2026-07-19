import agentChat from './agentChat.js';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

function refinerConfig() {
  return {
    baseUrl: process.env.YTAI_OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
    apiKey: process.env.YTAI_OPENROUTER_API_KEY || '',
    model: process.env.YTAI_OPENROUTER_CHAT_MODEL || 'google/gemma-4-e4b'
  };
}

// The refiner's job: fold the three-tier stack (global role, subject scope,
// year boundary) into ONE clean system prompt. It must preserve meaning, not
// invent capabilities — this is a polish/merge pass, not a rewrite of policy.
const REFINER_SYSTEM =
  'You are a prompt engineer. You are given a tutor system prompt that was ' +
  'assembled by concatenating two layers: a global role/product-scope layer, ' +
  'and a subject-and-year layer (the content, teaching tone, notation, and ' +
  'knowledge boundary for a specific school subject at a specific year level). ' +
  'Merge them into ONE coherent, well-structured system prompt.\n\n' +
  'Rules:\n' +
  '- Preserve every instruction, constraint, role, tone rule, notation/format ' +
  'convention, boundary, and tool/annotation instruction. Lose nothing.\n' +
  '- Remove duplication and resolve any contradictions in favour of the more ' +
  'specific (subject/year) layer.\n' +
  '- Reorganise into a logical flow with clear sections; keep it concise.\n' +
  '- Do NOT add new rules, capabilities, or examples that were not implied by ' +
  'the input. Do NOT soften safety boundaries.\n' +
  '- Write the prompt in second person addressed to the tutor AI, exactly as a ' +
  'system prompt would be.\n' +
  '- Output ONLY the final merged system prompt in Markdown. No preamble, no ' +
  'explanation, no surrounding code fences.';

// Strip a wrapping ```/```markdown fence if the model added one despite being
// told not to, so we never store fence markers as part of the prompt.
function stripCodeFence(text) {
  const t = text.trim();
  if (!t.startsWith('```')) return t;
  return t
    .replace(/^```[a-zA-Z]*\n/, '')
    .replace(/\n```$/, '')
    .trim();
}

// Run the raw composite through the refinement model and return the merged
// prompt plus the provider usage/model for billing. Non-streaming from the
// caller's view — we drain agentChat's stream and accumulate the text.
export default async function refineCompositePrompt({ rawComposite, subjectLabel, year, log }) {
  const { baseUrl, apiKey, model } = refinerConfig();
  const userBody =
    `Refine the following ${subjectLabel} tutor system prompt for ${year}. ` +
    'It was assembled from a global layer and a subject-and-year layer. ' +
    'Merge them into one clean prompt:\n\n' +
    rawComposite;

  let text = '';
  let usage = null;
  let modelVersion = null;
  for await (const chunk of agentChat({
    baseUrl,
    apiKey,
    model,
    messages: [
      { role: 'system', content: REFINER_SYSTEM },
      { role: 'user', content: userBody }
    ],
    log,
    logFields: { purpose: 'composite_refine', subject: subjectLabel, year }
  })) {
    if (chunk.delta) text += chunk.delta;
    if (chunk.usage) usage = chunk.usage;
    if (chunk.modelVersion) modelVersion = chunk.modelVersion;
  }

  const content = stripCodeFence(text);
  if (!content) throw new Error('Refiner returned empty content');
  return { content, usage, model, modelVersion: modelVersion || model };
}

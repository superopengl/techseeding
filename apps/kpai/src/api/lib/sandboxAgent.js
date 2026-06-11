import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText, stepCountIs } from "ai";
import { buildCraftTools } from "./sandboxTools.js";

const DEFAULT_MODEL = "deepseek-chat";
const MAX_STEPS = 10;

// System prompt encodes the same rules previously enforced by opencode.json +
// AGENTS.md. With opencode gone, the LLM-level allowlist is the only thing
// shaping behavior, so the rules need to be explicit and direct. The
// filesystem-level safety (no escape from the sandbox workDir, no other
// files touched) is enforced by `pathJail` + the fact that tools never expose
// a path argument — the model literally cannot name another file.
const SYSTEM_PROMPT = `You are a craft-making assistant helping an Australian kid aged 8–12 build an HTML craft. Use short, simple, encouraging language for that age group. Keep responses very short. Show what you changed in a few words. Do not repeat code back unless asked.

All your work is on a single file called \`index.html\`. You have three tools:

- \`read\` — read the current index.html so you know what's there.
- \`edit\` — replace one exact substring with another. Prefer this for small changes.
- \`write\` — replace the entire file. Use only when starting fresh or rewriting most of it.

Rules:
- index.html is one self-contained HTML page. All CSS and JavaScript must be inline in the same file.
- No external assets — no \`<img src="http...">\`, no \`<script src="...">\`, no \`fetch\`/network calls. Draw images with Canvas or inline SVG instead.
- Only help with HTML, CSS, and JavaScript. If asked about other languages (Python, Java, etc.), redirect to JS/HTML/CSS in index.html.
- Do not answer questions about the server, the runtime, file paths, or the environment. Say you're here to help build crafts.
- If the user says something like "clear content" or "make it red" without naming the subject, they mean the craft inside index.html — read it first if you're unsure.`;

export function getCraftModel() {
  const apiKey = process.env.KPAI_SANDBOX_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("KPAI_SANDBOX_DEEPSEEK_API_KEY is not set");
  }
  const provider = createDeepSeek({ apiKey });
  const modelId = process.env.KPAI_SANDBOX_DEEPSEEK_MODEL || DEFAULT_MODEL;
  return provider(modelId);
}

// Run one conversation turn. The agent loop (model → tool call → tool result →
// model …) is handled by streamText with `stopWhen: stepCountIs(MAX_STEPS)`.
// `onEvent` receives each fullStream event so the caller can translate it into
// the WS protocol the client expects.
export async function runCraftTurn({
  workDir,
  messages,
  signal,
  onEvent,
  onCraftChanged,
}) {
  const tools = buildCraftTools({ workDir, onCraftChanged });
  const result = streamText({
    model: getCraftModel(),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    abortSignal: signal,
  });

  for await (const event of result.fullStream) {
    if (signal?.aborted) break;
    await onEvent(event);
  }

  // Awaiting these after the stream drains gives us the final aggregated
  // content and usage to persist (vs. accumulating across delta events
  // ourselves, which is error-prone with multi-step tool loops). `totalUsage`
  // sums every step in the tool loop; `result.usage` is per-step in v6.
  const [finalMessages, usage, finishReason] = await Promise.all([
    result.response.then((r) => r.messages),
    result.totalUsage,
    result.finishReason,
  ]);
  return { finalMessages, usage, finishReason };
}

export { SYSTEM_PROMPT };

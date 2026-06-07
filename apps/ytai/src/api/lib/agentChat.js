// Bail if the upstream model stops sending chunks for this long. Without
// this, a stalled OpenRouter / DeepSeek connection wedges the whole turn —
// fetch's signal doesn't fire on idle, only on close. 60s is generous for
// inter-token latency once streaming has started; the very first chunk on a
// cold start can take 10-20s with thinking models, so leave headroom.
const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

export default async function* agentChat({
  baseUrl,
  apiKey,
  model,
  messages,
  tools,
  signal,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  user,
  // Optional Fastify-style logger + extra fields so we can emit one
  // summary line per upstream call (status, bytes, chunk counts).
  // Without these, agentChat stays silent.
  log,
  logFields = {}
}) {
  if (!baseUrl) throw new Error('baseUrl is required');
  if (!model) throw new Error('model is required');

  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const body = {
    model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    // OpenRouter extension: ask the provider to include the per-call USD
    // cost in the final `usage` block so we can persist it for billing.
    // OpenAI-compat back-ends ignore the field harmlessly.
    usage: { include: true },
    // Disable the reasoning / thinking phase across every back-end we hit.
    // `enable_thinking` is the model-native top-level flag (DeepSeek / Qwen).
    // `reasoning.exclude` is OpenRouter's normalized form.
    // `chat_template_kwargs.enable_thinking` is what LM Studio passes through
    // to Gemma 4's chat template — the only knob that actually silences
    // <think>…</think> spans for Gemma in dev.
    // Sending all three is harmless: each back-end ignores the keys it
    // doesn't know.
    enable_thinking: false,
    reasoning: { exclude: true },
    chat_template_kwargs: { enable_thinking: false },
    // Pin the upstream provider so every turn in one session lands on the
    // same backend. Without this, OpenRouter is free to route turn N to a
    // different provider than turn N-1, which is a guaranteed prompt-cache
    // miss even when the prefix bytes match. LM Studio ignores the field.
    provider: { allow_fallbacks: false }
  };
  if (Array.isArray(tools) && tools.length > 0) body.tools = tools;
  // Per-session stickiness hint. OpenRouter forwards the top-level `user`
  // field to providers that consume it for cache routing (OpenAI, Azure).
  // For Gemma backends it's harmless; the value is whatever the caller
  // passes in (we use the tutor sessionId so every turn in one session
  // carries the same identifier).
  if (typeof user === 'string' && user.length > 0) body.user = user;

  // Wrap the caller's signal with our own so we can also fire on idle. Caller
  // aborts → our controller aborts → fetch aborts. Idle timer fires → our
  // controller aborts → fetch aborts → we throw a specific timeout error so
  // the caller can distinguish stall from cancellation.
  const aborter = new AbortController();
  let timedOut = false;
  let idleTimer = null;
  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (!idleTimeoutMs) return;
    idleTimer = setTimeout(() => {
      timedOut = true;
      aborter.abort();
    }, idleTimeoutMs);
  };
  const onUpstreamAbort = () => aborter.abort();
  if (signal) {
    if (signal.aborted) aborter.abort();
    else signal.addEventListener('abort', onUpstreamAbort);
  }

  resetIdle();

  const requestBodyJson = JSON.stringify(body);
  const startedAt = Date.now();

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: requestBodyJson,
      signal: aborter.signal
    });
  } catch (err) {
    if (idleTimer) clearTimeout(idleTimer);
    if (signal) signal.removeEventListener('abort', onUpstreamAbort);
    if (timedOut) {
      throw new Error(`Brain upstream stalled (no chunk for ${idleTimeoutMs}ms before request started)`);
    }
    throw err;
  }

  log?.info(
    {
      ...logFields,
      endpoint,
      status: res.status,
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
      requestBytes: requestBodyJson.length,
      messageCount: messages.length,
      hasTools: Array.isArray(tools) && tools.length > 0
    },
    'agentChat: upstream response headers'
  );

  if (!res.ok) {
    if (idleTimer) clearTimeout(idleTimer);
    if (signal) signal.removeEventListener('abort', onUpstreamAbort);
    const detail = await res.text().catch(() => '');
    throw new Error(`API ${res.status} from ${endpoint}: ${detail.slice(0, 500)}`);
  }
  if (!res.body) {
    if (idleTimer) clearTimeout(idleTimer);
    if (signal) signal.removeEventListener('abort', onUpstreamAbort);
    throw new Error(`No response body from ${endpoint}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const streamedToolIndexes = new Set();

  // Per-call telemetry. Logged once at stream end (or in `finally` if the
  // generator gets disposed early). Lets us see whether the upstream sent
  // anything at all — invaluable when assistantContent ends up empty.
  let totalBytes = 0;
  let sseBlocks = 0;
  let parsedChunks = 0;
  let parseErrors = 0;
  let contentDeltas = 0;
  let contentDeltaBytes = 0;
  let toolCallChunks = 0;
  let finishReasons = 0;
  let usageChunks = 0;
  let lastFinishReason = null;
  let sawDone = false;
  // First ~500 bytes of the response body — useful when the stream had
  // no parseable chunks (the upstream may have sent an error blob or
  // empty body that explains the silence).
  let rawPreview = '';

  try {
    while (true) {
      let value;
      let done;
      try {
        ({ value, done } = await reader.read());
      } catch (err) {
        if (timedOut) {
          throw new Error(`Brain upstream stalled (no chunk for ${idleTimeoutMs}ms)`);
        }
        throw err;
      }
      if (done) break;
      resetIdle();
      const decoded = decoder.decode(value, { stream: true });
      totalBytes += value?.byteLength ?? 0;
      if (rawPreview.length < 500) {
        rawPreview = (rawPreview + decoded).slice(0, 500);
      }
      buffer += decoded;

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        sseBlocks += 1;
        const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;
        const data = dataLine.slice(5).trim();
        if (data === '[DONE]') {
          sawDone = true;
          return;
        }
        // Parse separately from interpret so an upstream-embedded error
        // can throw out of the loop instead of being swallowed by the
        // parse-error catch.
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          parseErrors += 1;
          continue;
        }
        parsedChunks += 1;
        if (process.env.YTAI_DEBUG_LLM === '1') {
          // eslint-disable-next-line no-console
          console.log('[agentChat] chunk', JSON.stringify(json));
        }
        // Upstream-embedded error. LM Studio (and some OpenRouter
        // providers) emit a 200 response with one SSE block that has
        // `{"error":{"message":"..."}}` instead of `{"choices":[...]}`.
        // Without this branch we'd silently swallow it, leave the turn
        // empty, and surface a misleading "couldn't put together an
        // answer" fallback to the student. Throwing here propagates as
        // `turnError` so the route SSE-errors with the real message.
        if (json.error) {
          const detail =
            typeof json.error?.message === 'string'
              ? json.error.message
              : JSON.stringify(json.error);
          throw new Error(`Upstream API error: ${detail.slice(0, 500)}`);
        }
        const choice = json.choices?.[0];
        const delta = choice?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          contentDeltas += 1;
          contentDeltaBytes += delta.length;
          yield { delta };
        }
        const deltaToolCalls = choice?.delta?.tool_calls;
        if (Array.isArray(deltaToolCalls) && deltaToolCalls.length > 0) {
          for (const tc of deltaToolCalls) streamedToolIndexes.add(tc.index ?? 0);
          toolCallChunks += 1;
          yield { toolCallChunks: deltaToolCalls };
        }
        // Fallback: some providers return non-streamed tool calls on the
        // final chunk under choice.message.tool_calls instead of delta.
        // Skip indexes already covered by streamed delta chunks — otherwise
        // their args get concatenated downstream and JSON.parse fails.
        const finalToolCalls = choice?.message?.tool_calls;
        if (Array.isArray(finalToolCalls) && finalToolCalls.length > 0) {
          const normalized = finalToolCalls
            .map((tc, i) => ({
              index: tc.index ?? i,
              id: tc.id,
              type: tc.type,
              function: {
                name: tc.function?.name,
                arguments:
                  typeof tc.function?.arguments === 'string'
                    ? tc.function.arguments
                    : JSON.stringify(tc.function?.arguments ?? {})
              }
            }))
            .filter((tc) => !streamedToolIndexes.has(tc.index));
          if (normalized.length > 0) {
            toolCallChunks += 1;
            yield { toolCallChunks: normalized };
          }
        }
        if (choice?.finish_reason) {
          finishReasons += 1;
          lastFinishReason = choice.finish_reason;
          yield { finishReason: choice.finish_reason };
        }
        // Many OpenRouter providers emit usage chunks on every delta. The
        // last one wins downstream; yielding all of them is harmless.
        // `json.model` is the provider's resolved model id (often a more
        // specific version than what we requested) — surface it so we
        // can persist it alongside the usage record.
        if (json.usage || json.model) {
          usageChunks += 1;
          yield { usage: json.usage ?? null, modelVersion: json.model ?? null };
        }
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    if (signal) signal.removeEventListener('abort', onUpstreamAbort);
    try {
      reader.releaseLock();
    } catch {
      // already released
    }
    // One summary line per upstream call. When assistantContent ends up
    // empty, this tells us whether the upstream sent ANY chunks at all
    // (parsedChunks=0 → silent stream, the body preview shows what we
    // got instead) or sent chunks that just had no usable content
    // (contentDeltas=0 + finishReasons>0 → model returned `stop` with
    // no text). `requestBytes` highlights payload-size regressions.
    log?.info(
      {
        ...logFields,
        endpoint,
        status: res?.status,
        elapsedMs: Date.now() - startedAt,
        requestBytes: requestBodyJson.length,
        responseBytes: totalBytes,
        sseBlocks,
        parsedChunks,
        parseErrors,
        contentDeltas,
        contentDeltaBytes,
        toolCallChunks,
        finishReasons,
        lastFinishReason,
        usageChunks,
        sawDone,
        // Emit the raw response preview whenever the upstream produced no
        // usable content — covers both "totally empty / non-JSON body"
        // (parsedChunks=0) AND "chunks parsed but nothing useful in them"
        // (the silent-stop bug we're chasing). Suppressed only on healthy
        // streams to keep log volume manageable.
        rawPreview: contentDeltas === 0 ? rawPreview : undefined
      },
      'agentChat: upstream stream complete'
    );
  }
}

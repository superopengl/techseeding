import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Input, Button, Alert, Typography } from "antd";
import { SendOutlined, BulbOutlined, EditOutlined, FileTextOutlined, CheckCircleFilled, LoadingOutlined, WarningFilled, DownOutlined, RightOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loading } from "./Loading";
import { apiCall } from "../api";
import { colors, fonts, shadows } from "../theme";

const { TextArea } = Input;

// Friendly labels and icons for the small set of tools the AI is allowed to use.
// Anything not in this map renders with a generic chip — kids never see raw
// opencode tool names like "edit" or "bash".
const TOOL_DISPLAY = {
  read: { icon: <FileTextOutlined />, label: "Looking at your craft" },
  edit: { icon: <EditOutlined />, label: "Editing your craft" },
  write: { icon: <EditOutlined />, label: "Writing your craft" },
  glob: { icon: <FileTextOutlined />, label: "Looking at your craft" },
  list: { icon: <FileTextOutlined />, label: "Looking at your craft" },
};

function toolDisplay(tool) {
  return TOOL_DISPLAY[tool] || { icon: <FileTextOutlined />, label: `Using ${tool}` };
}

function statusIcon(status) {
  if (status === "completed") return <CheckCircleFilled style={{ color: colors.successGreen }} />;
  if (status === "error") return <WarningFilled style={{ color: "#ff4d4f" }} />;
  return <LoadingOutlined style={{ color: colors.accentBlue }} />;
}

function ReasoningPart({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div
      style={{
        margin: "6px 0",
        background: "rgba(124, 92, 252, 0.06)",
        border: "1px solid rgba(124, 92, 252, 0.18)",
        borderRadius: 12,
        padding: "8px 10px",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: colors.accentPurple,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {open ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
        <BulbOutlined />
        <span>Thinking</span>
      </button>
      {open && (
        <div
          style={{
            margin: "6px 0 0",
            wordBreak: "break-word",
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.body,
            lineHeight: 1.5,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={REASONING_MD_COMPONENTS}>
            {text}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function ToolPart({ part }) {
  const tool = part.tool || "tool";
  const status = part.state?.status || "pending";
  const display = toolDisplay(tool);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        margin: "4px 0",
        padding: "6px 12px",
        borderRadius: 999,
        background: status === "error" ? "#fff1f0" : colors.mintBg,
        border: `1px solid ${status === "error" ? "#ffa39e" : "rgba(67, 184, 140, 0.25)"}`,
        fontSize: 13,
        color: colors.bodyStrong,
        fontWeight: 500,
        maxWidth: "100%",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", fontSize: 14 }}>{display.icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display.label}</span>
      <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 4 }}>{statusIcon(status)}</span>
    </div>
  );
}

// Markdown components scoped to a chat bubble: tight paragraph margins, our
// brand color for links, monospace+tinted background for inline and block code.
// onDark switches code-block colors so they read against the user-bubble's
// primary background — though we currently only call MarkdownText for assistant
// messages, this keeps it composable.
function makeMarkdownComponents({ onDark }) {
  const codeText = onDark ? "rgba(255,255,255,0.95)" : colors.heading;
  const codeBg = onDark ? "rgba(255,255,255,0.18)" : "#f1f5f9";
  const codeBlockBg = onDark ? "rgba(0,0,0,0.25)" : "#1f2937";
  const codeBlockText = onDark ? "#fff" : "#e2e8f0";
  return {
    p: ({ node, ...props }) => <p style={{ margin: "4px 0", lineHeight: 1.55 }} {...props} />,
    ul: ({ node, ...props }) => <ul style={{ margin: "4px 0", paddingInlineStart: 22 }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: "4px 0", paddingInlineStart: 22 }} {...props} />,
    li: ({ node, ...props }) => <li style={{ margin: "2px 0", lineHeight: 1.5 }} {...props} />,
    h1: ({ node, ...props }) => <h3 style={{ margin: "8px 0 4px", fontSize: 16 }} {...props} />,
    h2: ({ node, ...props }) => <h3 style={{ margin: "8px 0 4px", fontSize: 15 }} {...props} />,
    h3: ({ node, ...props }) => <h4 style={{ margin: "6px 0 4px", fontSize: 14 }} {...props} />,
    a: ({ node, ...props }) => (
      <a
        style={{ color: onDark ? "#fff" : colors.primary, textDecoration: "underline" }}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote
        style={{
          margin: "6px 0",
          padding: "4px 10px",
          borderLeft: `3px solid ${onDark ? "rgba(255,255,255,0.5)" : colors.border}`,
          color: onDark ? "rgba(255,255,255,0.85)" : colors.body,
        }}
        {...props}
      />
    ),
    pre: ({ node, ...props }) => (
      <pre
        style={{
          margin: "6px 0",
          padding: "10px 12px",
          background: codeBlockBg,
          color: codeBlockText,
          borderRadius: 8,
          overflowX: "auto",
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
        {...props}
      />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      // react-markdown 9 passes inline implicitly; detect by absence of language class
      const isInline = inline ?? !/^language-/.test(className || "");
      if (isInline) {
        return (
          <code
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.92em",
              padding: "1px 5px",
              borderRadius: 4,
              background: codeBg,
              color: codeText,
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={className}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.92em",
            background: "transparent",
            color: "inherit",
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    hr: ({ node, ...props }) => (
      <hr style={{ margin: "10px 0", border: 0, borderTop: `1px solid ${onDark ? "rgba(255,255,255,0.25)" : colors.border}` }} {...props} />
    ),
  };
}

const ASSISTANT_MD_COMPONENTS = makeMarkdownComponents({ onDark: false });
const REASONING_MD_COMPONENTS = makeMarkdownComponents({ onDark: false });

function MarkdownText({ text, components }) {
  if (!text) return null;
  return (
    <div
      style={{
        wordBreak: "break-word",
        margin: "2px 0",
        fontSize: 14,
        lineHeight: 1.55,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function PlainText({ text }) {
  if (!text) return null;
  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: "2px 0",
        fontSize: 14,
        lineHeight: 1.55,
      }}
    >
      {text}
    </div>
  );
}

function partsInOrder(partsMap) {
  return Array.from(partsMap?.values?.() ?? []);
}

// A part is "renderable" iff our UI will produce visible output for it. We
// filter out bookkeeping parts the bubble doesn't render, AND text/reasoning
// parts that haven't streamed any characters yet (their components return null
// for empty text). This same predicate gates the spinner — keeping the two in
// sync prevents the empty-bubble-no-spinner gap that opens during the brief
// window between an assistant message being created and its first token.
function partIsRenderable(p) {
  if (!p?.type) return false;
  if (p.synthetic || p.ignored) return false;
  if (p.type === "text" || p.type === "reasoning") return typeof p.text === "string" && p.text.length > 0;
  if (p.type === "tool") return true;
  return false;
}

function formatMessageTime(ms) {
  if (!ms || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${date} · ${time}`;
}

function MessageBubble({ entry }) {
  const role = entry.info?.role;
  const isUser = role === "user";
  const parts = partsInOrder(entry.parts);
  const visibleParts = parts.filter(partIsRenderable);

  if (visibleParts.length === 0) return null;

  const time = formatMessageTime(entry.info?.time?.created);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          maxWidth: "85%",
        }}
      >
        <div
          style={{
            background: isUser ? colors.primary : colors.surface,
            color: isUser ? colors.onDark : colors.heading,
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "10px 14px",
            boxShadow: shadows.cardSubtle,
            border: isUser ? "none" : `1px solid ${colors.border}`,
          }}
        >
          {visibleParts.map((p, i) => {
            const key = p.id || `${p.type}-${i}`;
            if (p.type === "text") {
              // User text is what the kid typed — render verbatim. Assistant
              // text is markdown (code fences, lists, bold, etc.) and gets the
              // full renderer.
              return isUser
                ? <PlainText key={key} text={p.text} />
                : <MarkdownText key={key} text={p.text} components={ASSISTANT_MD_COMPONENTS} />;
            }
            if (p.type === "reasoning") return <ReasoningPart key={key} text={p.text} />;
            if (p.type === "tool") return <ToolPart key={key} part={p} />;
            return null;
          })}
        </div>
        {time && (
          <div
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 3,
              padding: isUser ? "0 6px 0 0" : "0 0 0 6px",
              userSelect: "none",
            }}
          >
            {time}
          </div>
        )}
      </div>
    </div>
  );
}

function StartingMask() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: colors.body,
      }}
    >
      <Loading size="large" description={<span style={{ fontSize: 16 }}>Starting AI assistant…</span>} />
    </div>
  );
}

function EmptyHint() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: colors.muted,
        textAlign: "center",
        padding: 24,
      }}
    >
      <Typography.Text style={{ fontSize: 16, fontWeight: 600, color: colors.bodyStrong }}>
        Tell the AI what to make
      </Typography.Text>
      <Typography.Text style={{ fontSize: 13, color: colors.body }}>
        Try: "make a craft where I catch falling stars"
      </Typography.Text>
    </div>
  );
}

export function Conversation({ sandboxId, onFileChanged }) {
  const [phase, setPhase] = useState("starting"); // starting | ready | disconnected
  const [messages, setMessages] = useState(() => new Map());
  const [order, setOrder] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  // Texts the user submitted while we weren't connected; flushed in order on
  // the next "ready" event so a click during a transient disconnect doesn't
  // get lost.
  const pendingSendsRef = useRef([]);
  // Auto-reconnect timer. The reconnect itself is silent (no UI state shown);
  // the only signal the kid sees is that their next message lands once the
  // socket comes back.
  const reconnectTimerRef = useRef(null);
  const RECONNECT_DELAY_MS = 1500;

  // History fetch — runs on sandbox change only, independently of the WS
  // lifecycle. Keeping it in its own effect means a reconnect (which only
  // bumps reconnectKey) doesn't refetch, and React's dev-mode double-mount
  // doesn't accidentally skip it the way a sandbox-id ref would.
  useEffect(() => {
    if (!sandboxId) return;
    let cancelled = false;
    setMessages(new Map());
    setOrder([]);
    pendingSendsRef.current = [];

    apiCall(`/api/sandbox/${sandboxId}/messages`)
      .then((data) => {
        if (cancelled) return;
        const historical = data?.messages ?? [];
        if (historical.length === 0) return;
        setMessages((prev) => {
          const next = new Map(prev);
          for (const m of historical) {
            if (!m?.id) continue;
            if (next.has(m.id)) continue;
            // Rebuild the parts Map from the structured payload so reasoning
            // panels and tool chips render on reload. For older rows that only
            // have `text`, synthesize a single text part as a fallback.
            const partsMap = new Map();
            if (Array.isArray(m.parts) && m.parts.length > 0) {
              for (const p of m.parts) {
                if (!p?.id || !p.type) continue;
                partsMap.set(p.id, { ...p, messageID: m.id });
              }
            } else if (m.text) {
              const partId = `${m.id}-text`;
              partsMap.set(partId, { id: partId, messageID: m.id, type: "text", text: m.text });
            }
            next.set(m.id, {
              info: {
                id: m.id,
                role: m.role,
                time: { created: m.createdAt ? Date.parse(m.createdAt) : Date.now() },
              },
              parts: partsMap,
            });
          }
          return next;
        });
        // Prepend so historical messages always sit above any live message
        // that may have arrived before the fetch resolved.
        setOrder((prev) => {
          const seen = new Set(prev);
          const newHistorical = [];
          for (const m of historical) {
            if (!m?.id || seen.has(m.id)) continue;
            newHistorical.push(m.id);
            seen.add(m.id);
          }
          return [...newHistorical, ...prev];
        });
      })
      .catch((err) => {
        if (!cancelled) {
          // History fetch failure shouldn't block the live session — just log
          // and let the WS open with an empty backlog.
          console.warn("Failed to load message history:", err);
        }
      });

    return () => { cancelled = true; };
  }, [sandboxId]);

  useEffect(() => {
    if (!sandboxId) return;

    setPhase("starting");
    setBusy(false);
    setError(null);

    let cancelled = false;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}/api/ws?sandboxId=${sandboxId}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === "starting") {
        setPhase("starting");
      } else if (msg.type === "ready") {
        setPhase("ready");
        // Flush anything queued while disconnected/reconnecting.
        while (pendingSendsRef.current.length > 0) {
          const queued = pendingSendsRef.current.shift();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "send", text: queued }));
          }
        }
      } else if (msg.type === "idle") {
        setBusy(false);
      } else if (msg.type === "message") {
        const info = msg.info;
        if (!info?.id) return;
        setMessages((prev) => {
          const next = new Map(prev);
          const existing = next.get(info.id);
          next.set(info.id, { info, parts: existing?.parts ?? new Map() });
          return next;
        });
        setOrder((prev) => (prev.includes(info.id) ? prev : [...prev, info.id]));
        if (info.role === "user") setBusy(true);
        if (info.role === "assistant" && info.time?.completed) setBusy(false);
      } else if (msg.type === "part") {
        const part = msg.part;
        if (!part?.messageID) return;
        setMessages((prev) => {
          const next = new Map(prev);
          let entry = next.get(part.messageID);
          if (!entry) {
            entry = { info: { id: part.messageID }, parts: new Map() };
          } else {
            entry = { ...entry, parts: new Map(entry.parts) };
          }
          entry.parts.set(part.id, part);
          next.set(part.messageID, entry);
          return next;
        });
        setOrder((prev) => (prev.includes(part.messageID) ? prev : [...prev, part.messageID]));
      } else if (msg.type === "part-removed") {
        const { messageID, partID } = msg;
        setMessages((prev) => {
          const next = new Map(prev);
          const entry = next.get(messageID);
          if (entry) {
            const parts = new Map(entry.parts);
            parts.delete(partID);
            next.set(messageID, { ...entry, parts });
          }
          return next;
        });
      } else if (msg.type === "file-changed") {
        onFileChanged?.();
      } else if (msg.type === "rate-limit") {
        setError("You're sending too many messages — wait a moment and try again.");
      } else if (msg.type === "error" || msg.type === "session-error") {
        setError(msg.error || "Something went wrong.");
      }
    };

    ws.onclose = () => {
      if (!cancelled) {
        setPhase("disconnected");
        setBusy(false);
      }
    };

    return () => {
      cancelled = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try { ws.close(); } catch { /* already closed */ }
      }
    };
  }, [sandboxId, reconnectKey, onFileChanged]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [order, messages, busy]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setError(null);

    const ready = phase === "ready" && wsRef.current?.readyState === WebSocket.OPEN;
    if (ready) {
      wsRef.current.send(JSON.stringify({ type: "send", text }));
      return;
    }
    // Not connected: queue and (re)kick the WS effect so it opens a new
    // connection. The "ready" handler flushes the queue.
    pendingSendsRef.current.push(text);
    if (phase === "disconnected") {
      setReconnectKey((k) => k + 1);
    }
  }, [input, phase]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const orderedMessages = useMemo(
    () => order.map((id) => messages.get(id)).filter(Boolean),
    [order, messages]
  );

  // Derive "show Thinking…" purely from message state so it can never get
  // stuck on a missing session.idle / time.completed signal: show it whenever
  // the most recent message is the user's or an assistant message that hasn't
  // streamed any *renderable* content yet (matching the bubble's own filter,
  // so the spinner stays up until the bubble actually has something to draw).
  const lastMessage = orderedMessages[orderedMessages.length - 1];
  const lastIsAssistantWithContent = lastMessage?.info?.role === "assistant" &&
    partsInOrder(lastMessage.parts).some(partIsRenderable);
  const showThinking = !!lastMessage && !lastIsAssistantWithContent;

  if (!sandboxId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.body,
        }}
      >
        Connecting...
      </div>
    );
  }

  // Input is always usable — sends made while disconnected/starting are queued
  // and flushed on the next "ready". Only disable while the assistant is
  // actively producing this turn so the kid doesn't accidentally interleave.
  const connecting = phase !== "ready";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: colors.canvas,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          minHeight: 0,
        }}
      >
        {phase === "starting" && orderedMessages.length === 0 ? (
          <StartingMask />
        ) : orderedMessages.length === 0 ? (
          <EmptyHint />
        ) : (
          <>
            {orderedMessages.map((entry) => (
              <MessageBubble key={entry.info?.id || Math.random()} entry={entry} />
            ))}
            {showThinking && (
              <div style={{ display: "flex", justifyContent: "flex-start", margin: "8px 0" }}>
                <div
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "16px 16px 16px 4px",
                    padding: "10px 14px",
                    boxShadow: shadows.cardSubtle,
                    color: colors.body,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <LoadingOutlined style={{ color: colors.accentBlue }} />
                  <span>Thinking…</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ margin: "0 12px 8px" }}
        />
      )}

      {connecting && (
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 6,
            margin: "0 12px 6px",
            padding: "4px 10px",
            background: colors.canvas,
            borderRadius: 999,
            fontSize: 11,
            color: colors.body,
          }}
        >
          <LoadingOutlined style={{ color: colors.accentBlue }} />
          <span>{phase === "disconnected" ? "Reconnecting…" : "Connecting…"}</span>
          {pendingSendsRef.current.length > 0 && (
            <span style={{ color: colors.muted }}>
              · {pendingSendsRef.current.length} queued
            </span>
          )}
        </div>
      )}
        <div
          style={{
            padding: 12,
            background: colors.surface,
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              phase === "ready"
                ? "Tell the AI what to make or change"
                : phase === "disconnected"
                ? "Disconnected — type to reconnect and send"
                : "Connecting…"
            }
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1, borderRadius: 12, fontSize: 14 }}
            maxLength={2000}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={!input.trim() || showThinking}
            style={{ borderRadius: 12 }}
          >
            Send
          </Button>
        </div>
    </div>
  );
}

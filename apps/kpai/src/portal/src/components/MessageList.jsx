import React, { Fragment, useState } from "react";
import { BulbOutlined, EditOutlined, FileTextOutlined, CheckCircleFilled, LoadingOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { colors, fonts, shadows } from "../theme";

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
  // No red error indicator — the AI may report `status: "error"` for benign
  // permission/no-op responses while the file change still went through, and a
  // red chip in front of a kid is alarming. Either it landed (check) or it's
  // still working (spinner).
  if (status === "completed" || status === "error") {
    return <CheckCircleFilled style={{ color: colors.successGreen }} />;
  }
  return <LoadingOutlined style={{ color: colors.accentBlue }} />;
}

// Markdown components scoped to a chat bubble: tight paragraph margins, brand
// link color, monospace+tinted background for inline and block code. `onDark`
// is reserved for future use (e.g. rendering inside a user-bubble background).
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

// `forceOpen` makes the panel always render its content with no toggle —
// student sandbox uses this so kids see the reasoning unfold in real time.
// Without it, the panel is collapsible and starts closed (admin debug view).
function ReasoningPart({ text, forceOpen }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const shown = forceOpen || open;
  const headerCommon = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: colors.accentBlue,
    fontWeight: 600,
    fontSize: 13,
  };
  return (
    <div
      style={{
        margin: "6px 0",
        background: "rgba(110, 193, 228, 0.08)",
        border: "1px solid rgba(110, 193, 228, 0.25)",
        borderRadius: 12,
        padding: "8px 10px",
      }}
    >
      {forceOpen ? (
        <div style={headerCommon}>
          <small>
            <BulbOutlined />
          </small>
          <small>
            <span>Thinking</span>
          </small>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            ...headerCommon,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {open ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
          <BulbOutlined />
          <span>Thinking</span>
        </button>
      )}
      {shown && (
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
        background: colors.mintBg,
        border: "1px solid rgba(67, 184, 140, 0.25)",
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

function MarkdownText({ text }) {
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={ASSISTANT_MD_COMPONENTS}>
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

export function partsInOrder(partsMap) {
  return Array.from(partsMap?.values?.() ?? []);
}

// A part is "renderable" iff our UI will produce visible output for it. Same
// predicate gates the Thinking spinner — keeping the two in sync prevents the
// empty-bubble-no-spinner gap during the brief window between an assistant
// message being created and its first token streaming in.
export function partIsRenderable(p) {
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

// Convert a row from `/api/sandbox/:id/messages` (or admin's per-session
// `messages[]`) into the `{info, parts: Map}` entry shape the bubble renderer
// consumes. Falls back to a single synthesized text part for legacy rows that
// only have `content.text` and no `content.parts`.
export function entryFromPersistedMessage(m) {
  if (!m?.id) return null;
  const id = m.id;
  const role = m.role || m.type;
  const text = m.text ?? m.content?.text ?? "";
  const partsArray = Array.isArray(m.parts)
    ? m.parts
    : Array.isArray(m.content?.parts) ? m.content.parts : null;
  const partsMap = new Map();
  if (partsArray && partsArray.length > 0) {
    for (const p of partsArray) {
      if (!p?.id || !p.type) continue;
      partsMap.set(p.id, { ...p, messageID: id });
    }
  } else if (text) {
    const partId = `${id}-text`;
    partsMap.set(partId, { id: partId, messageID: id, type: "text", text });
  }
  const created = m.createdAt
    ? (typeof m.createdAt === "number" ? m.createdAt : Date.parse(m.createdAt))
    : Date.now();
  return { info: { id, role, time: { created } }, parts: partsMap };
}

// Walk visible parts and coalesce runs of consecutive `reasoning` parts into
// a single synthetic reasoning part with concatenated text. Without this the
// merged-bubble path renders one "Thinking" panel per original message; the
// kid sees a stack of identical-looking panels instead of a single growing
// stream of thoughts.
function coalesceReasoningParts(visibleParts) {
  const out = [];
  let buffer = null;
  for (const p of visibleParts) {
    if (p.type === "reasoning") {
      if (!buffer) {
        buffer = { ...p };
      } else {
        const sep = buffer.text.endsWith("\n") ? "" : "\n\n";
        buffer = { ...buffer, text: buffer.text + sep + (p.text || "") };
      }
    } else {
      if (buffer) { out.push(buffer); buffer = null; }
      out.push(p);
    }
  }
  if (buffer) out.push(buffer);
  return out;
}

export function MessageBubble({ entry, footer, reasoningAlwaysOpen }) {
  const role = entry.info?.role;
  const isUser = role === "user";
  const parts = partsInOrder(entry.parts);
  const visibleParts = coalesceReasoningParts(parts.filter(partIsRenderable));

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
            background: isUser ? colors.ctaYellow : colors.surface,
            color: isUser ? colors.heading : colors.heading,
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "10px 14px",
            boxShadow: shadows.cardSubtle,
            border: isUser ? `1px solid ${colors.ctaYellowShadow}` : `1px solid ${colors.border}`,
          }}
        >
          {visibleParts.map((p, i) => {
            const key = p.id || `${p.type}-${i}`;
            if (p.type === "text") {
              return isUser
                ? <PlainText key={key} text={p.text} />
                : <MarkdownText key={key} text={p.text} />;
            }
            if (p.type === "reasoning") return <ReasoningPart key={key} text={p.text} forceOpen={reasoningAlwaysOpen} />;
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
        {footer}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        margin: "6px 0 6px 6px",
        color: colors.muted,
        fontSize: 11,
        opacity: 0.75,
      }}
    >
      <LoadingOutlined style={{ fontSize: 11 }} />
      <span>Thinking…</span>
    </div>
  );
}

// Opencode's agent loop emits one assistant message per turn-of-the-loop,
// which means a single "make me a stars game" prompt produces a sequence of
// short thinking-only bubbles (reasoning + tool call, reasoning + tool call,
// …) before the final bubble with prose. Each was rendering as its own
// bubble, which clutters the conversation. We collapse consecutive
// "thinking only" assistant entries — those with no visible text part —
// into a single merged bubble whose parts are the union of the originals.
// Once a bubble contains text, it stands alone.
function entryHasText(entry) {
  for (const part of entry.parts?.values?.() ?? []) {
    if (part?.type === "text" && typeof part.text === "string" && part.text.length > 0) {
      return true;
    }
  }
  return false;
}

function mergeAdjacentThinking(entries) {
  const out = [];
  let group = null;
  const flush = () => {
    if (group) { out.push(group); group = null; }
  };
  for (const entry of entries) {
    const role = entry.info?.role;
    if (role !== "assistant") {
      flush();
      out.push(entry);
      continue;
    }
    if (entryHasText(entry)) {
      flush();
      out.push(entry);
      continue;
    }
    if (!group) {
      group = { info: entry.info, parts: new Map(entry.parts) };
    } else {
      const mergedParts = new Map(group.parts);
      for (const [pid, p] of entry.parts.entries()) {
        mergedParts.set(pid, p);
      }
      group = { info: group.info, parts: mergedParts };
    }
  }
  flush();
  return out;
}

// MessageList renders a series of bubble entries. Optionally:
//  - showThinking: append a "Thinking…" bubble at the end (for live chat)
//  - footerForEntry: render-prop for caller to attach metadata under each
//    bubble (e.g. token/cost info in the admin debug view).
//  - reasoningAlwaysOpen: skip the collapsible toggle so reasoning is always
//    visible. Student sandbox passes true (kids should see thinking unfold);
//    admin debug view leaves it false so each panel starts collapsed.
export function MessageList({ entries, showThinking, footerForEntry, reasoningAlwaysOpen }) {
  const merged = mergeAdjacentThinking(entries);
  return (
    <>
      {merged.map((entry) => {
        const id = entry.info?.id;
        const footer = footerForEntry ? footerForEntry(entry) : null;
        return (
          <Fragment key={id || Math.random()}>
            <MessageBubble entry={entry} footer={footer} reasoningAlwaysOpen={reasoningAlwaysOpen} />
          </Fragment>
        );
      })}
      {showThinking && <ThinkingBubble />}
    </>
  );
}

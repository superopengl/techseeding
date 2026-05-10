import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Input, Button, Alert, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { Loading } from "./Loading";
import { MessageList, partsInOrder, partIsRenderable, entryFromPersistedMessage } from "./MessageList";
import { apiCall } from "../api";
import { colors } from "../theme";

const { TextArea } = Input;

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
            if (!m?.id || next.has(m.id)) continue;
            const entry = entryFromPersistedMessage(m);
            if (entry) next.set(m.id, entry);
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
      if (cancelled) return;
      setPhase("disconnected");
      setBusy(false);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!cancelled) setReconnectKey((k) => k + 1);
      }, RECONNECT_DELAY_MS);
    };

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
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
    pendingSendsRef.current.push(text);
    if (phase === "disconnected") {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
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
          padding: "16px 16px 16px 12px",
          minHeight: 0,
        }}
      >
        {phase === "starting" && orderedMessages.length === 0 ? (
          <StartingMask />
        ) : orderedMessages.length === 0 ? (
          <EmptyHint />
        ) : (
          <MessageList
            entries={orderedMessages}
            showThinking={showThinking}
            reasoningAlwaysOpen
          />
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
          placeholder="Tell the AI what to make or change"
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

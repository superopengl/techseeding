import React, { useState, useCallback, useRef, useEffect } from "react";
import { Drawer, Spin, Timeline, Tag, Button, Modal, Input, message, ConfigProvider, theme as antTheme } from "antd";
import { RightOutlined, DownOutlined, ReloadOutlined, RobotOutlined, QrcodeOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { colors, shadows } from "../theme";
import { GamePreview } from "./GamePreview";
import { apiCall } from "../api";
import { stripAnsi } from "../utils/stripAnsi";

const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;

const dark = {
  bg: "#1a1a2e",
  surface: "#232340",
  border: "#2d2d4a",
  text: "#e2e8f0",
  textMuted: "#8892a8",
  inputBg: "rgba(67, 184, 140, 0.15)",
  outputBg: "rgba(255, 255, 255, 0.05)",
};

function OutputMessage({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const text = stripAnsi(msg.content?.text || "");
  const preview = text.slice(0, 80).split("\n")[0];

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
      >
        {expanded
          ? <DownOutlined style={{ fontSize: 10, color: dark.textMuted }} />
          : <RightOutlined style={{ fontSize: 10, color: dark.textMuted }} />
        }
        <Tag style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>AI</Tag>
        <span style={{ color: dark.textMuted, fontSize: 11 }}>
          {new Date(msg.createdAt).toLocaleTimeString()}
        </span>
        {!expanded && (
          <span style={{ color: dark.textMuted, fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {preview}{text.length > 80 ? "…" : ""}
          </span>
        )}
      </div>
      {expanded && (
        <pre style={{
          margin: "6px 0 0 16px",
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: dark.text,
          fontFamily: "monospace",
          maxHeight: 300,
          overflow: "auto",
          padding: "8px 12px",
          borderRadius: 8,
          background: dark.outputBg,
          border: `1px solid ${dark.border}`,
        }}>
          {text}
        </pre>
      )}
    </div>
  );
}

function MessageTimeline({ sessions, showAi }) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: 24, color: dark.textMuted, textAlign: "center" }}>
        No messages yet.
      </div>
    );
  }

  const items = [];
  sessions.forEach((session, si) => {
    items.push({
      color: "blue",
      content: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag color="blue" style={{ margin: 0 }}>Session {si + 1}</Tag>
          <span style={{ color: dark.textMuted, fontSize: 12 }}>
            {new Date(session.createdAt).toLocaleString()}
            {session.closedAt && ` — ${new Date(session.closedAt).toLocaleString()}`}
          </span>
        </div>
      ),
    });

    session.messages.forEach((msg) => {
      if (msg.type === "request") {
        items.push({
          color: "green",
          content: (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Tag color="green" style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>Student</Tag>
                <span style={{ color: dark.textMuted, fontSize: 11 }}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <pre style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#fff",
                fontWeight: 600,
                fontFamily: "monospace",
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(67, 184, 140, 0.35)",
                border: "1px solid rgba(67, 184, 140, 0.4)",
              }}>
                {stripAnsi(msg.content?.text || "")}
              </pre>
            </div>
          ),
        });
      } else if (showAi) {
        const stripped = stripAnsi(msg.content?.text || "");
        if (!stripped) return;
        items.push({
          color: "gray",
          content: <OutputMessage msg={msg} />,
        });
      }
    });

    if (session.messages.length === 0) {
      items.push({
        color: "gray",
        content: <span style={{ color: dark.textMuted, fontSize: 13 }}>No messages in this session.</span>,
      });
    }
  });

  return (
    <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
      <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
        <Timeline items={items} />
      </div>
    </ConfigProvider>
  );
}

export function SandboxReviewDrawer({ open, sandboxId, sandboxTitle, onClose }) {
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open || !sandboxId) return;
    setLoading(true);
    apiCall(`/api/admin/sandbox/${sandboxId}/messages`)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [open, sandboxId]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(100 - MIN_PANEL_PCT, Math.max(MIN_PANEL_PCT, pct)));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <Drawer
      title={sandboxTitle || "Sandbox Review"}
      placement="bottom"
      height="85vh"
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
      extra={
        <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => setPreviewKey((k) => k + 1)}
          >
            Refresh Preview
          </Button>
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => setShowShare(true)}
            style={{ background: colors.ctaYellow, color: colors.heading, border: "none", fontWeight: 600, boxShadow: shadows.ctaButtonSmall }}
          >
            Share
          </Button>
          <Button
            type={showAi ? "primary" : "default"}
            icon={<RobotOutlined />}
            onClick={() => setShowAi((v) => !v)}
          >
            {showAi ? "Hide AI" : "Show AI"}
          </Button>
        </span>
      }
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div style={{
          width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)`,
          overflow: "hidden",
          pointerEvents: isDragging ? "none" : "auto",
          background: colors.canvas,
          padding: 8,
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid ${colors.border}`,
            boxShadow: shadows.cardSubtle,
          }}>
            <GamePreview sandboxId={sandboxId} refreshKey={previewKey} />
          </div>
        </div>
        <div
          onMouseDown={onMouseDown}
          style={{
            width: DIVIDER_WIDTH,
            cursor: "col-resize",
            background: colors.border,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.border)}
        />
        <div style={{
          flex: 1,
          overflow: "hidden",
          background: dark.bg,
          pointerEvents: isDragging ? "none" : "auto",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <Spin />
            </div>
          ) : (
            <MessageTimeline sessions={sessions} showAi={showAi} />
          )}
        </div>
      </div>
      <Modal
        title="Share Your Game"
        open={showShare}
        onCancel={() => setShowShare(false)}
        footer={null}
        width={400}
        destroyOnHidden
      >
        {(() => {
          const shareUrl = `${window.location.origin}/sandbox/${sandboxId}/preview`;
          return (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "#4a5568", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
                Scan the QR code or copy the URL below to share this game.
              </p>
              <div style={{
                display: "inline-block",
                padding: 20,
                borderRadius: 20,
                background: colors.mintBg,
                boxShadow: "0 2px 12px rgba(124,92,252,0.10)",
              }}>
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  fgColor={colors.primary}
                  level="H"
                  imageSettings={{
                    src: "/logo.png",
                    width: 40,
                    height: 40,
                    excavate: true,
                  }}
                />
              </div>
              <Input.Search
                value={shareUrl}
                readOnly
                enterButton="Copy"
                onSearch={() => {
                  navigator.clipboard.writeText(shareUrl);
                  message.success("Link copied!");
                }}
                style={{ marginTop: 16 }}
                styles={{ affixWrapper: { borderRadius: 12, height: 44 } }}
                enterButtonProps={{
                  style: {
                    height: 44,
                    borderRadius: "0 12px 12px 0",
                    background: colors.ctaYellow,
                    color: colors.heading,
                    border: "none",
                    fontWeight: 600,
                    boxShadow: shadows.ctaButtonSmall,
                  },
                }}
              />
            </div>
          );
        })()}
      </Modal>
    </Drawer>
  );
}

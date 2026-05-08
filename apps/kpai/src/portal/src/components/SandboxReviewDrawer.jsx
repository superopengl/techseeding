import React, { useState, useCallback, useRef, useEffect } from "react";
import { Drawer, Tag, Button, Checkbox, ConfigProvider, theme as antTheme, Modal, message, Typography, Input } from "antd";
import { QrcodeOutlined, ClearOutlined, ExportOutlined, UploadOutlined } from "@ant-design/icons";
import { Loading } from "./Loading";
import { ShareCraftModal } from "./ShareCraftModal";
import { colors, shadows } from "../theme";
import { CraftPreview } from "./CraftPreview";
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

function isUserMessage(type) {
  return type === "user" || type === "request";
}

const ChatMessage = React.memo(function ChatMessage({ msg }) {
  const right = isUserMessage(msg.type);
  const text = msg.text;
  const time = new Date(msg.createdAt).toLocaleTimeString();
  const lengthLabel = `${Number(msg.contentLength ?? text.length).toLocaleString()} chars`;

  const tokensLine = !right && (
    msg.inputTokens || msg.outputTokens || msg.reasoningTokens ||
    msg.cacheReadTokens || msg.cacheWriteTokens || msg.cost
  ) ? (
    <>
      in {Number(msg.inputTokens || 0).toLocaleString()}
      {" · "}out {Number(msg.outputTokens || 0).toLocaleString()}
      {" · "}reason {Number(msg.reasoningTokens || 0).toLocaleString()}
      {" · "}cache R/W {Number(msg.cacheReadTokens || 0).toLocaleString()}/{Number(msg.cacheWriteTokens || 0).toLocaleString()}
      {" · "}${Number(msg.cost || 0).toFixed(4)}
    </>
  ) : null;

  return (
    <div style={{
      display: "flex",
      justifyContent: right ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: right ? "flex-end" : "flex-start" }}>
        <pre style={{
          margin: 0,
          padding: "10px 14px",
          borderRadius: 12,
          background: right ? "rgba(67, 184, 140, 0.35)" : "rgba(255, 255, 255, 0.06)",
          border: `1px solid ${right ? "rgba(67, 184, 140, 0.4)" : dark.border}`,
          color: right ? "#fff" : dark.text,
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 360,
          overflow: "auto",
        }}>
          {text || <span style={{ color: dark.textMuted, fontStyle: "italic" }}>(empty)</span>}
        </pre>
        <div style={{
          marginTop: 4,
          fontSize: 10,
          color: dark.textMuted,
          textAlign: right ? "right" : "left",
        }}>
          <span>{time} · {lengthLabel}</span>
          {tokensLine && <div>{tokensLine}</div>}
        </div>
      </div>
    </div>
  );
});

const ChatList = React.memo(function ChatList({ sessions, showAi }) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: 24, color: dark.textMuted, textAlign: "center" }}>
        No messages yet.
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
      <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
        {sessions.map((session, si) => {
          const visibleMessages = showAi
            ? session.messages
            : session.messages.filter((m) => isUserMessage(m.type));
          return (
            <div key={session.sessionId} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "8px 0 16px" }}>
                <Tag color="blue" style={{ margin: 0 }}>Session {si + 1}</Tag>
                <span style={{ color: dark.textMuted, fontSize: 11 }}>
                  {new Date(session.createdAt).toLocaleString()}
                  {session.closedAt && ` — ${new Date(session.closedAt).toLocaleString()}`}
                </span>
              </div>
              {visibleMessages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
            </div>
          );
        })}
      </div>
    </ConfigProvider>
  );
});

export function SandboxReviewDrawer({ open, sandboxId, sandboxTitle, sandboxWorkDir, studentName, onClose }) {
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadValue, setUploadValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);

  const UPLOAD_MAX_LENGTH = 2_000_000;

  const handleUpload = useCallback(async () => {
    if (uploadValue.length > UPLOAD_MAX_LENGTH) {
      message.error(`Content must be ${UPLOAD_MAX_LENGTH.toLocaleString()} characters or less.`);
      return;
    }
    setUploading(true);
    try {
      await apiCall(`/api/admin/sandbox/${sandboxId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: uploadValue }),
      });
      message.success("Uploaded.");
      setShowUpload(false);
      setUploadValue("");
      setPreviewKey((k) => k + 1);
    } catch (err) {
      message.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [sandboxId, uploadValue]);

  useEffect(() => {
    if (!open || !sandboxId) return;
    setLoading(true);
    apiCall(`/api/admin/sandbox/${sandboxId}/messages`)
      .then((data) => setSessions(data.sessions.map((s) => ({
        ...s,
        messages: s.messages.map((m) => ({ ...m, text: stripAnsi(m.content?.text || "") })),
      }))))
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

  const previewUrl = `${window.location.origin}/api/sandbox/${sandboxId}/preview`;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span>{[studentName, sandboxTitle || "Sandbox Review"].filter(Boolean).join(" - ")}</span>
          {sandboxId && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Typography.Text
                copyable={{ text: previewUrl, tooltips: ["Copy work dir", "Copied"] }}
                style={{ fontSize: 10, fontWeight: 400, color: colors.muted, fontFamily: "monospace" }}
              >
                {previewUrl}
              </Typography.Text>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open preview in new tab"
                title={[studentName, sandboxTitle || "Sandbox Review"].filter(Boolean).join(" - ")}
              >
                <ExportOutlined />
              </a>
              <a
                rel="noopener noreferrer"
                aria-label="Open share QR code modal"
                onClick={() => setShowShare(true)}
              >
                <QrcodeOutlined />
              </a>
            </span>
          )}
          <Typography.Text
            copyable={{ text: sandboxWorkDir, tooltips: ["Copy work dir", "Copied"] }}
            style={{ fontSize: 10, fontWeight: 400, color: colors.muted, fontFamily: "monospace" }}
          >
            {sandboxWorkDir || 'sandbox work dir broken'}
          </Typography.Text>
        </div>
      }
      placement="bottom"
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 }, wrapper: { height: "85vh" } }}
      extra={
        <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setShowUpload(true)}
          >
            Upload
          </Button>

          <Checkbox checked={showAi} onChange={(e) => setShowAi(e.target.checked)}>
            Show AI
          </Checkbox>
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
            <CraftPreview src={`/api/admin/sandbox/${sandboxId}/preview`} refreshKey={previewKey} />
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
              <Loading />
            </div>
          ) : (
            <ChatList sessions={sessions} showAi={showAi} />
          )}
        </div>
      </div>
      <ShareCraftModal
        open={showShare}
        onCancel={() => setShowShare(false)}
        sandboxId={sandboxId}
        description="Scan the QR code or copy the URL below to share this craft."
      />
      <Modal
        title="Upload index.html"
        open={showUpload}
        onCancel={() => {
          setShowUpload(false);
          setUploadValue("");
        }}
        confirmLoading={uploading}
        okText="Upload"
        okButtonProps={{
          icon: <UploadOutlined />,
          disabled: uploadValue.length >= UPLOAD_MAX_LENGTH,
        }}
        onOk={handleUpload}
        width={720}
        destroyOnHidden
      >
        <Input.TextArea
          value={uploadValue}
          onChange={(e) => setUploadValue(e.target.value)}
          maxLength={UPLOAD_MAX_LENGTH}
          rows={16}
          placeholder="Paste the full index.html content here..."
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
        <div
          style={{
            marginTop: 8,
            color: uploadValue.length >= UPLOAD_MAX_LENGTH ? "#ff4d4f" : colors.muted,
            fontSize: 12,
            textAlign: "right",
          }}
        >
          {uploadValue.length >= UPLOAD_MAX_LENGTH && "Maximum length reached. "}
          {uploadValue.length.toLocaleString()} / {UPLOAD_MAX_LENGTH.toLocaleString()} characters
        </div>
      </Modal>
    </Drawer>
  );
}

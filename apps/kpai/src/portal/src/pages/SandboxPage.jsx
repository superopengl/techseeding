import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Input, Button, Space, Modal } from "antd";
import { AppstoreOutlined, CloudUploadOutlined, LogoutOutlined } from "@ant-design/icons";
import { Terminal } from "../components/Terminal";
import { Logo } from "../components/Logo";
import { GamePreview } from "../components/GamePreview";
import { SandboxList } from "../components/SandboxList";
import { apiCall, fetchWithAuth } from "../api";
import { colors, fonts } from "../theme";

const { Header, Content } = Layout;

const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;

export function SandboxPage() {
  const { sandboxId } = useParams();
  const navigate = useNavigate();
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showMyGames, setShowMyGames] = useState(false);
  const [sandboxNotFound, setSandboxNotFound] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    apiCall("/api/me").then((data) => {
      setDisplayName(data.displayName);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    apiCall(`/api/sandbox/${sandboxId}`).then((data) => {
      setTitle(data.title || "Untitled Game");
    }).catch((err) => {
      if (err.status === 404) {
        setSandboxNotFound(true);
        setShowMyGames(true);
      }
    });
  }, [sandboxId]);

  useEffect(() => {
    document.title = title ? `Sandbox: ${title}` : "Sandbox";
  }, [title]);

  const startEditing = useCallback(() => {
    setTitleDraft(title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus({ cursor: "all" }), 0);
  }, [title]);

  const saveTitle = useCallback(() => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim() || "Untitled Game";
    if (trimmed === title) return;
    setTitle(trimmed);
    fetchWithAuth(`/api/sandbox/${sandboxId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    }).catch(() => {});
  }, [titleDraft, title, sandboxId]);

  const handleFileChanged = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);
  const containerRef = useRef(null);

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
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 24px",
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          height: 56,
        }}
      >
        <Logo />
        {displayName && (
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              color: colors.heading,
            }}
          >
            {displayName}
          </span>
        )}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {editingTitle ? (
            <Input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onPressEnter={saveTitle}
              maxLength={50}
              style={{
                width: 260,
                textAlign: "center",
                fontFamily: fonts.heading,
                fontSize: 16,
                fontWeight: 600,
              }}
            />
          ) : (
            <span
              onClick={startEditing}
              style={{
                fontFamily: fonts.heading,
                fontSize: 16,
                fontWeight: 600,
                color: colors.heading,
                cursor: "pointer",
                padding: "4px 12px",
                borderRadius: 8,
                border: `1px dashed transparent`,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.border)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
            >
              {title || "Untitled Game"}
            </span>
          )}
        </div>
        <Space size={8}>
          <Button type="text" icon={<AppstoreOutlined />} onClick={() => setShowMyGames(true)}>
            My Games
          </Button>
          <Button type="primary" icon={<CloudUploadOutlined />}>
            Release
          </Button>
          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Logout",
                content: "Are you sure you want to logout?",
                okText: "Logout",
                okButtonProps: { danger: true },
                onOk: () => {
                  sessionStorage.removeItem("lab67_token");
                  navigate("/login");
                },
              });
            }}
          >
            Logout
          </Button>
        </Space>
      </Header>
      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)`, overflow: "hidden", pointerEvents: isDragging ? "none" : "auto" }}>
          <GamePreview sandboxId={sandboxId} refreshKey={previewKey} />
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
        <div style={{ flex: 1, overflow: "hidden", background: colors.terminal, pointerEvents: isDragging ? "none" : "auto" }}>
          <Terminal sandboxId={sandboxId} onFileChanged={handleFileChanged} />
        </div>
      </div>
      <Modal
        title="My Games"
        open={showMyGames}
        onCancel={sandboxNotFound ? undefined : () => setShowMyGames(false)}
        closable={!sandboxNotFound}
        maskClosable={!sandboxNotFound}
        keyboard={!sandboxNotFound}
        footer={null}
        width={800}
        destroyOnClose
        styles={sandboxNotFound ? { mask: { background: "rgba(0, 0, 0, 0.75)" } } : undefined}
      >
        <SandboxList
          currentSandboxId={sandboxId}
          onSelect={() => { setShowMyGames(false); setSandboxNotFound(false); }}
          onDeleteCurrent={() => setSandboxNotFound(true)}
        />
      </Modal>
    </Layout>
  );
}

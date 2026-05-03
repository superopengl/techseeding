import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Input, Button, Space, Modal } from "antd";
import { AppstoreOutlined, QrcodeOutlined, LogoutOutlined } from "@ant-design/icons";
import { ShareCraftModal } from "../components/ShareCraftModal";
import { Terminal } from "../components/Terminal";
import { Logo } from "../components/Logo";
import { GamePreview } from "../components/GamePreview";
import { SandboxList } from "../components/SandboxList";
import { apiCall, fetchWithAuth } from "../api";
import confetti from "canvas-confetti";
import { colors, fonts, shadows, gradients } from "../theme";


const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;

export function SandboxPage() {
  const { sandboxId } = useParams();
  const navigate = useNavigate();
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [userName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showMyGames, setShowMyGames] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [sandboxNotFound, setSandboxNotFound] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    apiCall("/api/me").then((data) => {
      setDisplayName(data.userName);
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
    const trimmed = titleDraft.trim();
    if (!trimmed) return;
    setEditingTitle(false);
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

  useEffect(() => {
    if (!showShare) return;
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "1001",
      pointerEvents: "none",
    });
    document.body.appendChild(canvas);
    const fire = confetti.create(canvas, { resize: true, useWorker: true });

    const brandColors = ["#43b88c", "#fcd63c", "#7c5cfc", "#6ec1e4", "#f59e0b", "#61ce70"];
    let animId;
    let frameCount = 0;

    function frame() {
      if (frameCount % 2 === 0) {
        fire({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: brandColors });
        fire({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: brandColors });
      }
      frameCount++;
      animId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(animId);
      fire.reset();
      canvas.remove();
    };
  }, [showShare]);

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
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: gradients.hero,
          borderBottom: `1px solid rgba(255,255,255,0.15)`,
          height: 56,
          flexShrink: 0,
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: -40, left: -20 }} />
        <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: -30, right: 60 }} />
        <div style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.1)", top: -10, right: "30%" }} />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 24px",
            height: "100%",
          }}
        >
          <Logo size={36} square />
          {userName && (
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                fontWeight: 600,
                color: colors.onDark,
              }}
            >
              {userName}
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
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: colors.onDark,
                }}
              />
            ) : (
              <span
                onClick={startEditing}
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 16,
                  fontWeight: 600,
                  color: colors.onDark,
                  cursor: "pointer",
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px dashed transparent",
                  transition: "border-color 0.2s",
                  textShadow: shadows.textOnGradient,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
              >
                {title || "Untitled Game"}
              </span>
            )}
          </div>
          <Space size={8}>
            <Button type="text" icon={<AppstoreOutlined />} onClick={() => setShowMyGames(true)} style={{ color: colors.onDark }}>
              My Crafts
            </Button>
            <Button icon={<QrcodeOutlined />} onClick={() => setShowShare(true)} style={{ background: colors.ctaYellow, color: colors.heading, border: "none", fontWeight: 600, boxShadow: shadows.ctaButtonSmall }}>
              Share
            </Button>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              style={{ color: "rgba(255,255,255,0.7)" }}
              onClick={() => {
                Modal.confirm({
                  title: "Logout",
                  content: "Are you sure you want to logout?",
                  okText: "Logout",
                  cancelText: "Stay",
                  autoFocusButton: "cancel",
                  okButtonProps: {
                    style: {
                      borderRadius: 12,
                      fontWeight: 600,
                      background: colors.ctaYellow,
                      color: colors.heading,
                      border: "none",
                      boxShadow: shadows.ctaButtonSmall,
                    },
                  },
                  cancelButtonProps: {
                    style: { borderRadius: 12, fontWeight: 600 },
                  },
                  onOk: () => {
                    sessionStorage.removeItem("c4k_token");
                    sessionStorage.removeItem("c4k_role");
                    navigate("/login");
                  },
                });
              }}
            >
              Logout
            </Button>
          </Space>
        </div>
      </div>
      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)`, overflow: "hidden", pointerEvents: isDragging ? "none" : "auto", background: colors.canvas, padding: 8 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", border: `2px solid ${colors.border}`, boxShadow: shadows.cardSubtle }}>
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
        <div style={{ flex: 1, overflow: "hidden", background: colors.terminal, pointerEvents: isDragging ? "none" : "auto" }}>
          <Terminal sandboxId={sandboxId} onFileChanged={handleFileChanged} />
        </div>
      </div>
      <Modal
        title="My Crafts"
        open={showMyGames}
        onCancel={sandboxNotFound ? undefined : () => setShowMyGames(false)}
        closable={!sandboxNotFound}
        maskClosable={!sandboxNotFound}
        keyboard={!sandboxNotFound}
        footer={null}
        width={800}
        destroyOnHidden
        styles={sandboxNotFound ? { mask: { background: "rgba(0, 0, 0, 0.75)" } } : undefined}
      >
        <SandboxList
          currentSandboxId={sandboxId}
          onSelect={() => { setShowMyGames(false); setSandboxNotFound(false); }}
          onDeleteCurrent={() => setSandboxNotFound(true)}
        />
      </Modal>
      <ShareCraftModal
        open={showShare}
        onCancel={() => setShowShare(false)}
        sandboxId={sandboxId}
        zIndex={1002}
        description="📱 Scan the QR code or open the URL below in any browser — show it off to your family and friends 🎉, stun them with what you built 🤩, and tell them how fun KidPlayAI is! 🚀"
      />
    </Layout>
  );
}

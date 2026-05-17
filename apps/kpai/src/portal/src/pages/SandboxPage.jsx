import React, { useState, useCallback, useRef, useEffect } from "react";
import { setPageTitle } from "../utils/setPageTitle";
import { fgForHex } from "../utils/fgForHex";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Input, Button, Space, Modal, Tooltip, Avatar, Drawer, message, Typography, ColorPicker, Segmented } from "antd";
import { UnorderedListOutlined, ShareAltOutlined, LogoutOutlined, EditOutlined, UserOutlined, LockOutlined, CodeOutlined, EyeOutlined, PlusOutlined, PictureOutlined } from "@ant-design/icons";
import { useUser } from "../context/UserContext";
import { ShareCraftModal } from "../components/ShareCraftModal";
import { Conversation } from "../components/Conversation";
import { Logo } from "../components/Logo";
import { CraftPreview } from "../components/CraftPreview";
import { SandboxList } from "../components/SandboxList";
import { PasswordModal } from "../components/PasswordModal";
import { apiCall, fetchWithAuth, logout } from "../api";
import confetti from "canvas-confetti";
import { colors, fonts, shadows, gradients } from "../theme";

const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;
const NARROW_BREAKPOINT = 768;

function renderDrawerItem(item, setDrawerOpen) {
  return (
    <button
      key={item.key}
      type="button"
      disabled={item.disabled}
      onClick={() => {
        setDrawerOpen(false);
        item.onClick?.();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 20px",
        background: "transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
        fontSize: 15,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: item.disabled ? "not-allowed" : "pointer",
        color: item.danger ? "#ff4d4f" : colors.bodyStrong,
        opacity: item.disabled ? 0.4 : 1,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!item.disabled) e.currentTarget.style.background = colors.canvas;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 18, display: "inline-flex", width: 20, justifyContent: "center" }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

export function SandboxPage() {
  const { sandboxId } = useParams();
  const navigate = useNavigate();
  const { user, updateAvatarColor, clear: clearUser } = useUser();
  const userName = user?.userName || "";
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const hasPassword = user ? Boolean(user.hasPassword) : null;
  const avatarColor = user?.avatarColor || "#7c5cfc";
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT
  );
  const [activePanel, setActivePanel] = useState("preview");
  const [previewKey, setPreviewKey] = useState(0);
  const [title, setTitle] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [showMyCrafts, setShowMyCrafts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [sandboxNotFound, setSandboxNotFound] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorDraft, setColorDraft] = useState(avatarColor);
  const [savingColor, setSavingColor] = useState(false);
  const [creatingCraft, setCreatingCraft] = useState(false);
  const [galleries, setGalleries] = useState([]);
  const renameInputRef = useRef(null);

  useEffect(() => {
    apiCall("/api/me/galleries")
      .then((data) => setGalleries(Array.isArray(data) ? data : []))
      .catch(() => setGalleries([]));
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    apiCall(`/api/sandbox/${sandboxId}`).then((data) => {
      setTitle(data.title || "Untitled Craft");
    }).catch((err) => {
      if (err.status === 404) {
        setSandboxNotFound(true);
        setShowMyCrafts(true);
      }
    });
  }, [sandboxId]);

  useEffect(() => {
    setPageTitle(title ? `Sandbox: ${title}` : "Sandbox");
  }, [title]);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleCreateCraft = useCallback(async () => {
    if (creatingCraft) return;
    setCreatingCraft(true);
    try {
      const data = await apiCall("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      navigate(`/sandbox/${data.id}`);
    } catch (err) {
      message.error(err?.message || "Failed to create craft");
    } finally {
      setCreatingCraft(false);
    }
  }, [creatingCraft, navigate]);

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: "Logout",
      content: "Are you sure you want to logout?",
      okText: "Logout",
      okType: "danger",
      cancelText: "Stay",
      autoFocusButton: "cancel",
      okButtonProps: {
        type: "primary",
        danger: true,
        style: {
          borderRadius: 12,
          fontWeight: 600,
          background: "#ff4d4f",
          color: "#fff",
          border: "none",
          boxShadow: "0 2px 0 #d9363e",
        },
      },
      cancelButtonProps: {
        style: { borderRadius: 12, fontWeight: 600 },
      },
      onOk: async () => {
        await logout();
        clearUser();
        navigate("/");
      },
    });
  }, [navigate, clearUser]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const avatarInitial = (userName || "?").trim().charAt(0).toUpperCase();
  const avatarBg = avatarColor;
  const avatarFg = fgForHex(avatarColor);

  const openColorPicker = useCallback(() => {
    setColorDraft(avatarColor);
    setShowColorPicker(true);
  }, [avatarColor]);

  const handleColorSave = useCallback(async () => {
    if (!colorDraft || colorDraft.toLowerCase() === avatarColor.toLowerCase()) {
      setShowColorPicker(false);
      return;
    }
    try {
      setSavingColor(true);
      await updateAvatarColor(colorDraft);
      setShowColorPicker(false);
    } catch (err) {
      message.error(err?.message || "Failed to update avatar color");
    } finally {
      setSavingColor(false);
    }
  }, [colorDraft, avatarColor, updateAvatarColor]);

  const drawerItems = [
    {
      key: "new-craft",
      label: "New Craft",
      icon: <PlusOutlined />,
      disabled: creatingCraft,
      onClick: handleCreateCraft,
    },
    {
      key: "my-crafts",
      label: "My Crafts",
      icon: <UnorderedListOutlined />,
      onClick: () => setShowMyCrafts(true),
    },
    {
      key: "change-password",
      label: "Change Password",
      icon: <LockOutlined />,
      disabled: hasPassword === false,
      onClick: () => setShowChangePassword(true),
    },
  ];

  const logoutItem = {
    key: "logout",
    label: "Logout",
    icon: <LogoutOutlined />,
    danger: true,
    onClick: handleLogout,
  };

  const handleDrawerClose = () => setDrawerOpen(false);

  const openRenameModal = useCallback(() => {
    setRenameDraft(title);
    setShowRenameModal(true);
    setTimeout(() => renameInputRef.current?.focus({ cursor: "all" }), 0);
  }, [title]);

  const saveRename = useCallback(() => {
    const trimmed = renameDraft.trim();
    if (!trimmed) return;
    setShowRenameModal(false);
    if (trimmed === title) return;
    setTitle(trimmed);
    fetchWithAuth(`/api/sandbox/${sandboxId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    }).catch(() => { });
  }, [renameDraft, title, sandboxId]);

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
    if (narrow) return;
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
  }, [narrow]);

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
        {/* Decorative circles — kept on the far left/center to avoid the action buttons on the right */}
        <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: -40, left: -20, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)", bottom: -28, left: 140, pointerEvents: "none" }} />
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
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open KidPlayAI homepage in a new tab"
            style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
          >
            <Logo size={36} square />
          </a>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
            <span
              onClick={openRenameModal}
              title="Click to rename"
              style={{
                maxWidth: "100%",
                fontFamily: fonts.heading,
                fontSize: 16,
                fontWeight: 600,
                color: colors.onDark,
                cursor: "pointer",
                padding: "4px 12px",
                borderRadius: 8,
                border: "1px dashed rgba(255,255,255,0.25)",
                transition: "border-color 0.2s, background 0.2s",
                textShadow: shadows.textOnGradient,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                {title || "Untitled Craft"}
              </span>
              <EditOutlined style={{ fontSize: 13, opacity: 0.75, flexShrink: 0 }} />
            </span>
          </div>
          <Space size={8}>
            <Tooltip title="Start a new craft">
              <Button
                icon={<PlusOutlined />}
                onClick={handleCreateCraft}
                loading={creatingCraft}
                aria-label="Create new craft"
              />
            </Tooltip>
            <Button icon={<ShareAltOutlined />} onClick={() => setShowShare(true)} aria-label="Share" />
            <Button
              shape="circle"
              aria-label="Open user menu"
              onClick={() => setDrawerOpen(true)}
              style={{ padding: 0, border: "none", background: "transparent", boxShadow: "none" }}
            >
              <Avatar
                size={32}
                style={{
                  background: avatarBg,
                  color: avatarFg,
                  fontFamily: fonts.heading,
                  fontSize: 18,
                  fontWeight: 700,
                }}
                icon={userName ? null : <UserOutlined />}
              >
                {userName ? avatarInitial : null}
              </Avatar>
            </Button>
          </Space>
        </div>
      </div>
      <div ref={containerRef} style={{ display: "flex", flexDirection: narrow ? "column" : "row", flex: 1, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            ...(narrow
              ? { width: "100%", flex: 1, minHeight: 0, display: activePanel === "preview" ? "block" : "none" }
              : { width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)` }),
            overflow: "hidden",
            pointerEvents: isDragging ? "none" : "auto",
            background: colors.canvas,
            padding: 8,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", border: `2px solid ${colors.border}`, boxShadow: shadows.cardSubtle }}>
            <CraftPreview src={`/api/sandbox/${sandboxId}/preview`} refreshKey={previewKey} />
            <div
              title="Preview updates automatically as the AI builds"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(255,255,255,0.92)",
                borderRadius: 999,
                boxShadow: shadows.cardSubtle,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: colors.bodyStrong,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.successGreen,
                  boxShadow: `0 0 0 0 ${colors.successGreen}`,
                  animation: "kpaiLivePulse 1.8s ease-out infinite",
                }}
              />
              LIVE
            </div>
          </div>
        </div>
        {!narrow && (
          <div
            onMouseDown={onMouseDown}
            title="Drag to resize"
            style={{
              width: DIVIDER_WIDTH,
              cursor: "col-resize",
              background: colors.border,
              flexShrink: 0,
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.border)}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                pointerEvents: "none",
                opacity: 0.55,
              }}
            >
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: colors.muted }} />
            </div>
          </div>
        )}
        <div
          style={{
            ...(narrow
              ? { width: "100%", flex: 1, minHeight: 0, display: activePanel === "terminal" ? "block" : "none" }
              : { flex: 1 }),
            overflow: "hidden",
            background: colors.canvas,
            pointerEvents: isDragging ? "none" : "auto",
          }}
        >
          <Conversation sandboxId={sandboxId} onFileChanged={handleFileChanged} />
        </div>
        {narrow && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${colors.border}`,
              background: colors.surface,
              padding: "10px 12px",
            }}
          >
            <Segmented
              block
              size="large"
              value={activePanel}
              onChange={setActivePanel}
              className={`kpai-panel-toggle kpai-panel-toggle-${activePanel}`}
              options={[
                { label: "Preview", value: "preview", icon: <EyeOutlined /> },
                { label: "AI Assistant", value: "terminal", icon: <CodeOutlined /> },
              ]}
            />
          </div>
        )}
      </div>
      <Modal
        title="My Crafts"
        open={showMyCrafts}
        onCancel={sandboxNotFound ? undefined : () => setShowMyCrafts(false)}
        closable={!sandboxNotFound}
        mask={{ closable: !sandboxNotFound }}
        keyboard={!sandboxNotFound}
        footer={null}
        width={800}
        destroyOnHidden
        styles={sandboxNotFound ? { mask: { background: "rgba(0, 0, 0, 0.75)" } } : undefined}
      >
        <SandboxList
          currentSandboxId={sandboxId}
          onSelect={() => { setShowMyCrafts(false); setSandboxNotFound(false); }}
          onDeleteCurrent={() => setSandboxNotFound(true)}
        />
      </Modal>
      <ShareCraftModal
        open={showShare}
        onCancel={() => setShowShare(false)}
        sandboxId={sandboxId}
        zIndex={1002}
        studentMode
        description="📱 Show it off to your family and friends 🎉, stun them with what you built 🤩, and tell them how fun KidPlayAI is! 🚀"
      />
      <Modal
        title="Rename craft"
        open={showRenameModal}
        onCancel={() => setShowRenameModal(false)}
        onOk={saveRename}
        okText="Save"
        okButtonProps={{ disabled: !renameDraft.trim() }}
        destroyOnHidden
        width={420}
      >
        <Input
          ref={renameInputRef}
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onPressEnter={saveRename}
          maxLength={50}
          autoFocus
          placeholder="Enter a name for your craft"
          showCount
        />
      </Modal>
      <PasswordModal
        open={showChangePassword}
        mode="change"
        onSuccess={() => setShowChangePassword(false)}
        onCancel={() => setShowChangePassword(false)}
      />
      <Drawer
        placement="right"
        width={260}
        open={drawerOpen}
        onClose={handleDrawerClose}
        closable={false}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 16px" }}>
            <Tooltip title="Change avatar color">
              <button
                type="button"
                aria-label="Change avatar color"
                onClick={() => {
                  setDrawerOpen(false);
                  openColorPicker();
                }}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  lineHeight: 0,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderRadius: "50%",
                }}
              >
                <Avatar
                  size={56}
                  style={{
                    background: avatarBg,
                    color: avatarFg,
                    fontFamily: fonts.heading,
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                  icon={userName ? null : <UserOutlined />}
                >
                  {userName ? avatarInitial : null}
                </Avatar>
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `1.5px solid ${colors.surface}`,
                    background: colors.surface,
                    color: colors.bodyStrong,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: shadows.cardSubtle,
                  }}
                >
                  <EditOutlined style={{ fontSize: 12 }} />
                </span>
              </button>
            </Tooltip>
            <div style={{ minWidth: 0, overflow: "hidden", lineHeight: 1.3 }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <Typography.Text strong style={{ fontSize: 16 }}>{userName}</Typography.Text>
              </div>
              {userName && (
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Typography.Text type="secondary">
                    {fullName || userName || "—"}
                  </Typography.Text>
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 1, background: colors.border }} />
          <div style={{ display: "flex", flexDirection: "column", padding: "8px 0", flex: 1, overflowY: "auto" }}>
            {drawerItems.map((item) => renderDrawerItem(item, setDrawerOpen))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px 8px",
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ fontSize: 18, display: "inline-flex", width: 20, justifyContent: "center" }}>
                <PictureOutlined />
              </span>
              <span>Gallery</span>
            </div>
            {galleries.length === 0 ? (
              <div
                style={{
                  padding: "4px 20px 8px 54px",
                  fontSize: 13,
                  color: colors.muted,
                  fontStyle: "italic",
                }}
              >
                No galleries yet
              </div>
            ) : (
              galleries.map((g) =>
                renderDrawerItem(
                  {
                    key: `gallery-${g.id}`,
                    label: g.name,
                    icon: (
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: g.colorHex || colors.primary,
                        }}
                      />
                    ),
                    onClick: () =>
                      window.open(`/gallery/${g.id}/expo`, "_blank", "noopener,noreferrer"),
                  },
                  setDrawerOpen,
                ),
              )
            )}
          </div>
          <div style={{ flexShrink: 0, borderTop: `1px solid ${colors.border}`, padding: "4px 0" }}>
            {renderDrawerItem(logoutItem, setDrawerOpen)}
          </div>
        </div>
      </Drawer>
      <Modal
        title="Choose your avatar color"
        open={showColorPicker}
        onCancel={() => setShowColorPicker(false)}
        footer={null}
        width={380}
        destroyOnHidden
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
          <Avatar
            size={72}
            style={{
              background: colorDraft,
              color: fgForHex(colorDraft),
              fontFamily: fonts.heading,
              fontSize: 40,
              fontWeight: 700,
            }}
            icon={userName ? null : <UserOutlined />}
          >
            {userName ? avatarInitial : null}
          </Avatar>
          <ColorPicker
            value={colorDraft}
            onChange={(c) => setColorDraft(c.toHexString())}
            disabledAlpha
            showText
            format="hex"
            size="large"
            defaultOpen
            styles={{ popupOverlayInner: { width: 280 } }}
            style={{ width: 220, padding: "10px 14px", alignItems: "center" }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
            Pick any color you like — it will show on your avatar everywhere.
          </Typography.Text>
          <Button
            type="primary"
            block
            loading={savingColor}
            onClick={handleColorSave}
            style={{ marginTop: 8 }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

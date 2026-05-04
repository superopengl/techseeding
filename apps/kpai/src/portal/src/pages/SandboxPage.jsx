import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { setPageTitle } from "../utils/setPageTitle";
import { getCookie, setCookie } from "../utils/cookie";
import { colorForName } from "../utils/colorForName";
import { useParams, useNavigate } from "react-router-dom";
import { Layout, Input, Button, Space, Modal, Tooltip, Avatar, Dropdown, message, Typography } from "antd";
import { UnorderedListOutlined, QrcodeOutlined, LogoutOutlined, EditOutlined, QuestionCircleOutlined, UserOutlined, PlusOutlined, LockOutlined } from "@ant-design/icons";
import { ShareCraftModal } from "../components/ShareCraftModal";
import { Terminal } from "../components/Terminal";
import { Logo } from "../components/Logo";
import { CraftPreview } from "../components/CraftPreview";
import { SandboxList } from "../components/SandboxList";
import { PasswordModal } from "../components/PasswordModal";
import { apiCall, fetchWithAuth } from "../api";

const SandboxTour = lazy(() =>
  import("../components/SandboxTour").then((m) => ({ default: m.SandboxTour }))
);

const TOUR_MENU_STEPS = new Set([4, 5, 6, 7]);
import confetti from "canvas-confetti";
import { colors, fonts, shadows, gradients } from "../theme";

const TOUR_COOKIE_NAME = "kpai_sandbox_tour_seen";


const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;

export function SandboxPage() {
  const { sandboxId } = useParams();
  const navigate = useNavigate();
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [userName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showMyCrafts, setShowMyCrafts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [sandboxNotFound, setSandboxNotFound] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourCurrent, setTourCurrent] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const titleInputRef = useRef(null);
  const previewRef = useRef(null);
  const terminalRef = useRef(null);
  const titleRef = useRef(null);
  const shareRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    apiCall("/api/me").then((data) => {
      setDisplayName(data.userName);
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setHasPassword(Boolean(data.hasPassword));
    }).catch(() => { });
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
    if (sandboxNotFound) return;
    if (getCookie(TOUR_COOKIE_NAME)) return;
    const timer = setTimeout(() => setTourOpen(true), 600);
    return () => clearTimeout(timer);
  }, [sandboxNotFound]);

  const markTourSeen = useCallback(() => {
    setCookie(TOUR_COOKIE_NAME, "1");
  }, []);

  const handleTourClose = useCallback(() => {
    setTourOpen(false);
    setTourCurrent(0);
    markTourSeen();
  }, [markTourSeen]);

  const handleTourFinish = useCallback(() => {
    setTourOpen(false);
    setTourCurrent(0);
    markTourSeen();
  }, [markTourSeen]);

  const openTour = useCallback(() => {
    setTourCurrent(0);
    setTourOpen(true);
  }, []);

  useEffect(() => {
    if (!tourOpen) {
      setDropdownOpen(false);
    }
  }, [tourOpen]);

  const handleTourChange = useCallback((next) => {
    const shouldOpenMenu = TOUR_MENU_STEPS.has(next);
    if (shouldOpenMenu && !dropdownOpen) {
      // Open the menu first so its DOM is mounted before Tour re-targets.
      setDropdownOpen(true);
      requestAnimationFrame(() => setTourCurrent(next));
      return;
    }
    if (!shouldOpenMenu && dropdownOpen) {
      setDropdownOpen(false);
    }
    setTourCurrent(next);
  }, [dropdownOpen]);

  const handleNewCraft = useCallback(async () => {
    try {
      const data = await apiCall("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      navigate(`/sandbox/${data.id}`);
    } catch {
      message.error("Failed to create craft");
    }
  }, [navigate]);

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
      onOk: () => {
        sessionStorage.removeItem("kpai_token");
        sessionStorage.removeItem("kpai_role");
        navigate("/");
      },
    });
  }, [navigate]);

  const menuItemStyle = {
    height: 44,
    lineHeight: "44px",
    fontSize: 15,
    fontWeight: 500,
    padding: "0 18px",
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const avatarInitial = (userName || "?").trim().charAt(0).toUpperCase();
  const { bg: avatarBg, fg: avatarFg } = colorForName(userName);

  const userMenuItems = [
    {
      key: "profile",
      type: "group",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", lineHeight: 1.3, minWidth: 0 }}>
          <Avatar
            size={42}
            style={{
              background: avatarBg,
              color: avatarFg,
              fontFamily: fonts.heading,
              fontSize: 26,
              fontWeight: 700,
              flexShrink: 0,
            }}
            icon={userName ? null : <UserOutlined />}
          >
            {userName ? avatarInitial : null}
          </Avatar>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Typography.Text strong>{userName}</Typography.Text>
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
      ),
    },
    { type: "divider" },
    {
      key: "new-craft",
      label: <span className="kpai-tour-new-craft">New Craft</span>,
      icon: <PlusOutlined style={{ fontSize: 16 }} />,
      style: menuItemStyle,
      onClick: handleNewCraft,
    },
    {
      key: "my-crafts",
      label: <span className="kpai-tour-my-crafts">All Crafts</span>,
      icon: <UnorderedListOutlined style={{ fontSize: 16 }} />,
      style: menuItemStyle,
      onClick: () => setShowMyCrafts(true),
    },
    {
      key: "guidance",
      label: <span className="kpai-tour-guidance">Show Guidance</span>,
      icon: <QuestionCircleOutlined style={{ fontSize: 16 }} />,
      style: menuItemStyle,
      onClick: openTour,
    },
    {
      key: "change-password",
      label: "Change Password",
      icon: <LockOutlined style={{ fontSize: 16 }} />,
      style: menuItemStyle,
      disabled: hasPassword === false,
      onClick: () => setShowChangePassword(true),
    },
    { type: "divider" },
    {
      key: "logout",
      label: <span className="kpai-tour-logout">Logout</span>,
      icon: <LogoutOutlined style={{ fontSize: 16 }} />,
      danger: true,
      style: menuItemStyle,
      onClick: handleLogout,
    },
  ];

  const handleDropdownOpenChange = (next) => {
    if (tourOpen && TOUR_MENU_STEPS.has(tourCurrent)) {
      // Tour is driving the menu; ignore close attempts.
      if (next) setDropdownOpen(true);
      return;
    }
    setDropdownOpen(next);
  };

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
    }).catch(() => { });
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
          <Logo size={36} square />
          <div ref={titleRef} style={{ display: "inline-flex", alignItems: "center" }}>
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
                title="Click to rename"
                style={{
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
                <span>{title || "Untitled Craft"}</span>
                <EditOutlined style={{ fontSize: 13, opacity: 0.75 }} />
              </span>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <Space size={8}>
            <Button ref={shareRef} icon={<QrcodeOutlined />} onClick={() => setShowShare(true)} style={{ background: colors.ctaYellow, color: colors.heading, border: "none", fontWeight: 600, boxShadow: shadows.ctaButtonSmall }}>
              Share
            </Button>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
              overlayStyle={{ minWidth: 220 }}
              open={dropdownOpen}
              onOpenChange={handleDropdownOpenChange}
            >
              <Button
                ref={avatarRef}
                shape="circle"
                aria-label="User menu"
                icon={<UserOutlined style={{ fontSize: 18 }} />}
              />
            </Dropdown>
          </Space>
        </div>
      </div>
      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <div ref={previewRef} style={{ width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)`, overflow: "hidden", pointerEvents: isDragging ? "none" : "auto", background: colors.canvas, padding: 8 }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", border: `2px solid ${colors.border}`, boxShadow: shadows.cardSubtle }}>
            <CraftPreview sandboxId={sandboxId} refreshKey={previewKey} />
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
        <div ref={terminalRef} style={{ flex: 1, overflow: "hidden", background: colors.terminal, pointerEvents: isDragging ? "none" : "auto" }}>
          <Terminal sandboxId={sandboxId} onFileChanged={handleFileChanged} />
        </div>
      </div>
      <Modal
        title="All Crafts"
        open={showMyCrafts}
        onCancel={sandboxNotFound ? undefined : () => setShowMyCrafts(false)}
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
          onSelect={() => { setShowMyCrafts(false); setSandboxNotFound(false); }}
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
      <PasswordModal
        open={showChangePassword}
        mode="change"
        onSuccess={() => setShowChangePassword(false)}
        onCancel={() => setShowChangePassword(false)}
      />
      {tourOpen && (
        <Suspense fallback={null}>
          <SandboxTour
            open={tourOpen}
            current={tourCurrent}
            onChange={handleTourChange}
            onClose={handleTourClose}
            onFinish={handleTourFinish}
            previewRef={previewRef}
            terminalRef={terminalRef}
            titleRef={titleRef}
            shareRef={shareRef}
            avatarRef={avatarRef}
          />
        </Suspense>
      )}
    </Layout>
  );
}

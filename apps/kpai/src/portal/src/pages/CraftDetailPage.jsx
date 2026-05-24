import React, { useEffect, useState } from "react";
import { Layout, Typography, Avatar, Button, Space, message, Tooltip } from "antd";
import { ArrowLeftOutlined, ShareAltOutlined, BranchesOutlined } from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { setPageTitle } from "../utils/setPageTitle";
import { Loading } from "../components/Loading";
import { CraftPreview } from "../components/CraftPreview";
import { Logo } from "../components/Logo";
import { CoinBalance, notifyCoinsChanged } from "../components/CoinBalance";
import { LikeButton } from "../components/LikeButton";
import { ForkButton } from "../components/ForkButton";
import { colors, gradients, shadows, fonts } from "../theme";
import { apiCall, isAuthenticated } from "../api";
import { fgForHex } from "../utils/fgForHex";

const { Header, Content } = Layout;

export function CraftDetailPage() {
  const { sandboxId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [craft, setCraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiCall(`/api/craft/${sandboxId}`)
      .then((data) => {
        if (cancelled) return;
        setCraft(data);
        setPageTitle(data.title || "Craft");
      })
      .catch((err) => {
        if (cancelled) return;
        message.error(err?.message || "Craft not found");
        navigate("/gallery");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sandboxId, navigate]);

  // Record a play once per page load. Server-side this is idempotent
  // per viewer per craft — repeat visits won't re-pay the bounty.
  useEffect(() => {
    if (!craft || !isAuthenticated()) return;
    apiCall(`/api/craft/${craft.id}/play`, { method: "POST" })
      .then((data) => {
        if (data?.grant) notifyCoinsChanged();
      })
      .catch(() => { /* play recording is best-effort */ });
  }, [craft]);

  if (loading || !craft) {
    return (
      <Layout style={{ minHeight: "100vh", background: gradients.login }}>
        <div style={{ textAlign: "center", padding: 120 }}>
          <Loading />
        </div>
      </Layout>
    );
  }

  const ownerColor = craft.ownerAvatarColor || "#7c5cfc";
  const ownerInitial = (craft.ownerFirstName || craft.ownerUserName || "?").trim().charAt(0).toUpperCase();
  const fullName = [craft.ownerFirstName, craft.ownerLastName].filter(Boolean).join(" ");

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: gradients.hero,
          borderBottom: `1px solid rgba(255,255,255,0.15)`,
          height: 56,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link to="/" aria-label="Home" style={{ display: "inline-flex", alignItems: "center" }}>
            <Logo size={36} square />
          </Link>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/gallery")}
            style={{ color: colors.onDark }}
          >
            Gallery
          </Button>
          <Typography.Text
            strong
            style={{
              color: colors.onDark,
              fontFamily: fonts.heading,
              fontSize: 18,
              textShadow: shadows.textOnGradient,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "40vw",
            }}
            title={craft.title || "Untitled Craft"}
          >
            {craft.title || "Untitled Craft"}
          </Typography.Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAuthenticated() && <CoinBalance />}
        </div>
      </Header>
      <Content style={{ display: "flex", flexDirection: "column", padding: 16, gap: 16 }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: "14px 18px",
            boxShadow: shadows.cardSubtle,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <Avatar size={48} style={{ background: ownerColor, color: fgForHex(ownerColor), fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            {ownerInitial}
          </Avatar>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 15, color: colors.heading }}>
              {craft.ownerUserName}
            </Typography.Text>
            {fullName && (
              <Typography.Text style={{ fontSize: 12, color: colors.body }}>
                {fullName}
              </Typography.Text>
            )}
            {craft.forkedFrom && (
              <span style={{ fontSize: 12, color: colors.muted, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <BranchesOutlined />
                Forked from{" "}
                <Link to={`/craft/${craft.forkedFrom.id}`} style={{ color: colors.accentPurple }}>
                  {craft.forkedFrom.title || "Untitled"}
                </Link>{" "}
                by <strong>{craft.forkedFrom.ownerUserName || "—"}</strong>
              </span>
            )}
          </div>
          <Space size={10} style={{ marginLeft: "auto" }}>
            {isAuthenticated() && (
              <>
                <LikeButton
                  sandboxId={craft.id}
                  initialLiked={craft.viewerLiked}
                  initialCount={craft.likeCount}
                />
                <ForkButton sandboxId={craft.id} count={craft.forkCount} />
              </>
            )}
            <Tooltip title={`${craft.playCount} plays`}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: colors.canvas,
                  border: `1px solid ${colors.border}`,
                  color: colors.body,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ▶ {craft.playCount}
              </span>
            </Tooltip>
            <Tooltip title="Copy share link">
              <Button
                shape="circle"
                icon={<ShareAltOutlined />}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href).then(
                    () => message.success("Link copied"),
                    () => message.error("Couldn't copy"),
                  );
                }}
                aria-label="Share craft"
              />
            </Tooltip>
          </Space>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 480,
            background: colors.surface,
            border: `2px solid ${colors.border}`,
            borderRadius: 16,
            boxShadow: shadows.cardSubtle,
            overflow: "hidden",
          }}
        >
          <CraftPreview src={`/api/sandbox/${craft.id}/preview`} />
        </div>
      </Content>
    </Layout>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Layout, Typography, Tag, Empty, message, Button, Avatar } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { setPageTitle } from "../utils/setPageTitle";
import { Loading } from "../components/Loading";
import { CraftPreview } from "../components/CraftPreview";
import { Logo } from "../components/Logo";
import { PlayfulBackdrop } from "../components/PlayfulBackdrop";
import { colors, gradients, shadows, fonts } from "../theme";
import { apiCall } from "../api";
import { fgForHex } from "../utils/fgForHex";

const { Header, Content } = Layout;

export function GalleryExpoPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState(null);
  const [sandboxes, setSandboxes] = useState([]);

  const fetchExpo = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/api/gallery/${id}/expo`);
      setGallery(data.gallery);
      setSandboxes(data.sandboxes);
      setPageTitle(`Gallery of ${data.gallery.name}`);
    } catch (e) {
      message.error(e.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle("Gallery Expo");
    fetchExpo();
  }, [id]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const s of sandboxes) {
      if (!map.has(s.userId)) {
        map.set(s.userId, {
          userId: s.userId,
          userName: s.userName,
          firstName: s.firstName,
          lastName: s.lastName,
          avatarColor: s.avatarColor,
          sandboxes: [],
        });
      }
      map.get(s.userId).sandboxes.push(s);
    }
    return [...map.values()];
  }, [sandboxes]);

  return (
    <Layout style={{ minHeight: "100vh", background: gradients.login, position: "relative", overflow: "hidden" }}>
      <PlayfulBackdrop />
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: gradients.hero,
          borderBottom: `1px solid rgba(255,255,255,0.15)`,
          height: 56,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" aria-label="Go to homepage" style={{ display: "inline-flex", alignItems: "center" }}>
            <Logo size={36} square />
          </Link>
          {gallery ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  color: colors.onDark,
                  fontFamily: fonts.heading,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Gallery of {gallery.name}
              </span>
            </div>
          ) : (
            <span style={{ color: colors.onDarkSecondary, fontSize: 14 }}>Gallery Expo</span>
          )}
          <span style={{ color: colors.onDarkSecondary, fontSize: 13 }}>
            {sandboxes.length} {sandboxes.length === 1 ? "craft" : "crafts"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchExpo}
            style={{ color: colors.onDark }}
          >
            Refresh
          </Button>
        </div>
      </Header>
      <Content style={{ padding: 24, position: "relative", zIndex: 1 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Loading />
          </div>
        ) : sandboxes.length === 0 ? (
          <div style={{ padding: 80 }}>
            <Empty description="No crafts in this gallery yet." />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {groups.map((g) => (
              <UserGroup key={g.userId} group={g} />
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
}

function UserGroup({ group }) {
  const fullName = [group.firstName, group.lastName].filter(Boolean).join(" ");
  const initial = (fullName || group.userName || "?").trim().charAt(0).toUpperCase();
  const bg = group.avatarColor || "#7c5cfc";
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <Avatar
          size={64}
          style={{
            background: bg,
            color: fgForHex(bg),
            fontFamily: fonts.heading,
            fontSize: 30,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initial}
        </Avatar>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <Typography.Text
            strong
            style={{ color: colors.heading, fontFamily: fonts.heading, fontSize: 18 }}
          >
            {group.userName}
          </Typography.Text>
          {fullName && (
            <Typography.Text style={{ color: colors.body, fontSize: 13 }}>
              {fullName}
            </Typography.Text>
          )}
        </div>
        <span style={{ marginLeft: "auto", color: colors.muted, fontSize: 12 }}>
          {group.sandboxes.length} {group.sandboxes.length === 1 ? "craft" : "crafts"}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {group.sandboxes.map((s) => (
          <SandboxCard key={s.id} sandbox={s} />
        ))}
      </div>
    </section>
  );
}

function SandboxCard({ sandbox }) {
  const previewUrl = `/api/sandbox/${sandbox.id}/preview`;
  const shareUrl = `${window.location.origin}${previewUrl}`;
  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: 16,
        boxShadow: shadows.cardSubtle,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          position: "relative",
          height: 420,
          background: colors.canvas,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <CraftPreview src={previewUrl} />
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            padding: 6,
            background: "#fff",
            borderRadius: 8,
            border: `1px solid ${colors.borderLight}`,
            boxShadow: shadows.cardSubtle,
            lineHeight: 0,
            pointerEvents: "auto",
          }}
          title="Scan to open this craft"
        >
          <QRCodeSVG
            value={shareUrl}
            size={88}
            fgColor={colors.heading}
            level="H"
            imageSettings={{
              src: "/logo-square.png",
              width: 22,
              height: 22,
              excavate: false,
            }}
          />
        </div>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Typography.Text
            strong
            style={{
              color: colors.heading,
              fontFamily: fonts.heading,
              fontSize: 16,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={sandbox.title || "Untitled Craft"}
          >
            {sandbox.title || "Untitled Craft"}
          </Typography.Text>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, flexShrink: 0 }}
          >
            Open
          </a>
        </div>
        <span style={{ fontSize: 11, color: colors.muted }}>
          Updated {new Date(sandbox.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

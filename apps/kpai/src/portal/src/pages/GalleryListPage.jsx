import React, { useEffect, useState } from "react";
import { Layout, Typography, Segmented, Empty, Button, Avatar, message, Tag } from "antd";
import { ReloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { setPageTitle } from "../utils/setPageTitle";
import { Loading } from "../components/Loading";
import { CraftPreview } from "../components/CraftPreview";
import { Logo } from "../components/Logo";
import { CoinBalance } from "../components/CoinBalance";
import { PlayfulBackdrop } from "../components/PlayfulBackdrop";
import { colors, gradients, shadows, fonts } from "../theme";
import { apiCall, isAuthenticated } from "../api";
import { fgForHex } from "../utils/fgForHex";

const { Header, Content } = Layout;

const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Most loved", value: "liked" },
  { label: "Most forked", value: "forked" },
];

export function GalleryListPage() {
  const { galleryId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = SORT_OPTIONS.find((o) => o.value === searchParams.get("sort"))?.value || "recent";
  const [loading, setLoading] = useState(true);
  const [crafts, setCrafts] = useState([]);
  const [gallery, setGallery] = useState(null);

  const fetchFeed = async (nextSort) => {
    setLoading(true);
    try {
      const path = galleryId ? `/api/gallery/${galleryId}` : "/api/gallery";
      const data = await apiCall(`${path}?sort=${nextSort}&pageSize=60`);
      setCrafts(Array.isArray(data?.crafts) ? data.crafts : []);
      setGallery(data?.gallery || null);
    } catch (e) {
      message.error(e.message || "Failed to load Gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle(galleryId && gallery?.name ? `Gallery · ${gallery.name}` : "Gallery");
  }, [galleryId, gallery]);

  useEffect(() => {
    fetchFeed(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, galleryId]);

  const onSortChange = (v) => {
    setSearchParams({ sort: v });
  };

  const title = gallery?.name ? `Gallery · ${gallery.name}` : "Gallery";

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
          <span
            style={{
              color: colors.onDark,
              fontFamily: fonts.heading,
              fontSize: 18,
              fontWeight: 700,
              textShadow: shadows.textOnGradient,
            }}
          >
            {title}
          </span>
          {gallery && (
            <Link to="/gallery" style={{ color: colors.onDarkSecondary, fontSize: 12, textDecoration: "underline" }}>
              See all crafts
            </Link>
          )}
          <span style={{ color: colors.onDarkSecondary, fontSize: 13 }}>
            {crafts.length} {crafts.length === 1 ? "craft" : "crafts"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAuthenticated() && <CoinBalance />}
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={() => fetchFeed(sort)}
            style={{ color: colors.onDark }}
          >
            Refresh
          </Button>
          {isAuthenticated() && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/sandbox")}
              style={{ color: colors.onDark }}
            >
              Back to my craft
            </Button>
          )}
        </div>
      </Header>
      <Content style={{ padding: 24, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Segmented options={SORT_OPTIONS} value={sort} onChange={onSortChange} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Loading />
          </div>
        ) : crafts.length === 0 ? (
          <div style={{ padding: 80 }}>
            <Empty
              description={
                gallery
                  ? `No published crafts in ${gallery.name} yet.`
                  : "No published crafts yet. Be the first!"
              }
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {crafts.map((c) => (
              <CraftCard key={c.id} craft={c} />
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
}

function CraftCard({ craft }) {
  const navigate = useNavigate();
  const ownerColor = craft.ownerAvatarColor || "#7c5cfc";
  const ownerInitial = (craft.ownerFirstName || craft.ownerUserName || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/craft/${craft.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/craft/${craft.id}`);
        }
      }}
      style={{
        background: colors.surface,
        borderRadius: 16,
        boxShadow: shadows.cardSubtle,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${colors.border}`,
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = shadows.cardElevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = shadows.cardSubtle;
      }}
    >
      <div
        style={{
          position: "relative",
          height: 240,
          background: colors.canvas,
          borderBottom: `1px solid ${colors.borderLight}`,
          pointerEvents: "none",
        }}
      >
        <CraftPreview src={`/api/sandbox/${craft.id}/preview`} />
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
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
          title={craft.title || "Untitled Craft"}
        >
          {craft.title || "Untitled Craft"}
        </Typography.Text>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar size={24} style={{ background: ownerColor, color: fgForHex(ownerColor), fontWeight: 700, fontSize: 12 }}>
            {ownerInitial}
          </Avatar>
          <Typography.Text style={{ fontSize: 13, color: colors.body }}>
            {craft.ownerUserName}
          </Typography.Text>
          <span style={{ marginLeft: "auto", fontSize: 12, color: colors.muted, display: "inline-flex", gap: 10 }}>
            <span title="Likes" style={{ color: craft.viewerLiked ? colors.accentPink || "#ff6b9a" : colors.muted }}>
              {craft.viewerLiked ? "♥" : "♡"} {craft.likeCount}
            </span>
            <span title="Plays">▶ {craft.playCount}</span>
          </span>
        </div>
        {craft.forkedFromSandboxId && (
          <Tag color="purple" style={{ alignSelf: "flex-start", fontSize: 11 }}>
            Forked craft
          </Tag>
        )}
      </div>
    </div>
  );
}

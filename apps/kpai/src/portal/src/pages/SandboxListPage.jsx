import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Card, Spin, Empty, message } from "antd";
import { RocketOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { colors, fonts, shadows } from "../theme";
import { apiCall } from "../api";

const { Header, Content } = Layout;

export function SandboxListPage() {
  useEffect(() => { document.title = "Sandbox List"; }, []);
  const navigate = useNavigate();
  const [sandboxes, setSandboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiCall("/api/sandbox")
      .then(setSandboxes)
      .catch(() => message.error("Failed to load your games"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const data = await apiCall("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      navigate(`/sandbox/${data.id}`);
    } catch {
      message.error("Failed to create game");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
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
        <RocketOutlined style={{ fontSize: 24, color: colors.primary }} />
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 22,
            fontWeight: 700,
            color: colors.heading,
          }}
        >
          Lab67
        </span>
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 16,
            color: colors.muted,
            marginLeft: 8,
          }}
        >
          My Games
        </span>
      </Header>

      <Content style={{ padding: 32, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260, 1fr))",
              gap: 24,
            }}
          >
            <Card
              hoverable
              onClick={handleCreate}
              loading={creating}
              style={{
                borderRadius: 16,
                border: `2px dashed ${colors.primary}`,
                background: colors.mintBg,
                boxShadow: "none",
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              styles={{ body: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: 24 } }}
            >
              <PlusOutlined style={{ fontSize: 36, color: colors.primary, marginBottom: 12 }} />
              <span
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.primary,
                }}
              >
                New Game
              </span>
            </Card>

            {sandboxes.map((s) => (
              <Card
                key={s.id}
                hoverable
                onClick={() => navigate(`/sandbox/${s.id}`)}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  boxShadow: shadows.cardSubtle,
                  minHeight: 180,
                }}
                styles={{ body: { padding: 24, display: "flex", flexDirection: "column", height: "100%" } }}
              >
                <ThunderboltOutlined style={{ fontSize: 28, color: colors.accentPurple, marginBottom: 12 }} />
                <div
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 17,
                    fontWeight: 700,
                    color: colors.heading,
                    marginBottom: 8,
                  }}
                >
                  {s.title || "Untitled Game"}
                </div>
                {s.description && (
                  <div style={{ color: colors.body, fontSize: 14, flex: 1 }}>
                    {s.description}
                  </div>
                )}
                <div style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </Card>
            ))}

            {sandboxes.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", paddingTop: 40 }}>
                <Empty
                  description={
                    <span style={{ color: colors.muted }}>
                      No games yet. Click "New Game" to get started!
                    </span>
                  }
                />
              </div>
            )}
          </div>
        )}
      </Content>
    </Layout>
  );
}

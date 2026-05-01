import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spin, Empty, Modal, Button, message } from "antd";
import { PlusOutlined, ThunderboltOutlined, DeleteOutlined } from "@ant-design/icons";
import { colors, fonts, shadows } from "../theme";
import { apiCall } from "../api";

export function SandboxList({ currentSandboxId }) {
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

  const handleDelete = (e, sandboxItem) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete Game",
      content: `Are you sure you want to delete "${sandboxItem.title || "Untitled Game"}"? This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiCall(`/api/sandbox/${sandboxItem.id}`, { method: "DELETE" });
          setSandboxes((prev) => prev.filter((s) => s.id !== sandboxItem.id));
          message.success(`${sandboxItem.title || "Untitled Game"} deleted`);
        } catch {
          message.error("Failed to delete game");
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
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
          aspectRatio: "1 / 1",
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

      {sandboxes.map((s) => {
        const isCurrent = s.id === currentSandboxId;
        return (
          <Card
            key={s.id}
            hoverable
            onClick={() => navigate(`/sandbox/${s.id}`)}
            style={{
              borderRadius: 16,
              border: isCurrent ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
              boxShadow: shadows.cardSubtle,
              aspectRatio: "1 / 1",
            }}
            styles={{ body: { padding: 24, display: "flex", flexDirection: "column", height: "100%" } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <ThunderboltOutlined style={{ fontSize: 28, color: colors.accentPurple }} />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => handleDelete(e, s)}
              >
                Delete
              </Button>
            </div>
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
        );
      })}

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
  );
}

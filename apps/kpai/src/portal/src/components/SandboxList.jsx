import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Spin, Modal, Button, message } from "antd";
import { PlusOutlined, ThunderboltOutlined, DeleteOutlined, PlayCircleFilled } from "@ant-design/icons";
import { colors, fonts, shadows } from "../theme";
import { apiCall } from "../api";

export function SandboxList({ currentSandboxId, onSelect, onDeleteCurrent }) {
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
      onSelect?.();
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
          if (sandboxItem.id === currentSandboxId) {
            onDeleteCurrent?.();
          }
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card
        hoverable
        onClick={handleCreate}
        loading={creating}
        style={{
          borderRadius: 12,
          border: `2px dashed ${colors.primary}`,
          background: colors.mintBg,
          boxShadow: "none",
        }}
        styles={{ body: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" } }}
      >
        <PlusOutlined style={{ fontSize: 20, color: colors.primary }} />
        <div>
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 15,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            New Game
          </div>
          <div style={{ color: colors.muted, fontSize: 12 }}>
            Start a new project
          </div>
        </div>
      </Card>

      {sandboxes.map((s) => {
        const isCurrent = s.id === currentSandboxId;
        return (
          <Card
            key={s.id}
            hoverable
            onClick={() => { navigate(`/sandbox/${s.id}`); onSelect?.(); }}
            style={{
              borderRadius: 12,
              border: isCurrent ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
              boxShadow: shadows.cardSubtle,
            }}
            styles={{ body: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" } }}
          >
            {isCurrent
              ? <PlayCircleFilled style={{ fontSize: 20, color: colors.primary }} />
              : <ThunderboltOutlined style={{ fontSize: 20, color: colors.accentPurple }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.heading,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.title || "Untitled Game"}
              </div>
              <div style={{ color: colors.muted, fontSize: 12 }}>
                {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => handleDelete(e, s)}
            >
              Delete
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

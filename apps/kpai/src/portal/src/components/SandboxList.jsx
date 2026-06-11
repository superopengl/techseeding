import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Modal, Button, message, Typography } from "antd";
import { PlusOutlined, ThunderboltOutlined, DeleteOutlined, PlayCircleFilled } from "@ant-design/icons";
import { Loading } from "./Loading";
import { colors, fonts, shadows } from "../theme";
import { apiCall } from "../api";

const { Text } = Typography;

export function SandboxList({ currentSandboxId, onSelect, onDeleteCurrent }) {
  const navigate = useNavigate();
  const [sandboxes, setSandboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiCall("/api/sandbox")
      .then(setSandboxes)
      .catch(() => message.error("Failed to load your crafts"))
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
      message.error("Failed to create craft");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (e, sandboxItem) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete Craft",
      content: `Are you sure you want to delete "${sandboxItem.title || "Untitled Craft"}"? This cannot be undone.`,
      okText: "Delete",
      cancelText: "Keep",
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
      onOk: async () => {
        try {
          await apiCall(`/api/sandbox/${sandboxItem.id}`, { method: "DELETE" });
          setSandboxes((prev) => prev.filter((s) => s.id !== sandboxItem.id));
          message.success(`${sandboxItem.title || "Untitled Craft"} deleted`);
          if (sandboxItem.id === currentSandboxId) {
            onDeleteCurrent?.();
          }
        } catch {
          message.error("Failed to delete craft");
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Loading size="large" />
      </div>
    );
  }

  const atLimit = sandboxes.length >= 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        @keyframes kpai-pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(97, 206, 112, 0.6); }
          70% { transform: scale(1.05); opacity: 0.85; box-shadow: 0 0 0 6px rgba(97, 206, 112, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(97, 206, 112, 0); }
        }
      `}</style>
      <Card
        hoverable={!atLimit}
        onClick={atLimit ? undefined : handleCreate}
        loading={creating}
        style={{
          borderRadius: 12,
          border: `2px dashed ${atLimit ? colors.muted : colors.primary}`,
          background: atLimit ? colors.canvas : colors.mintBg,
          boxShadow: "none",
          cursor: atLimit ? "not-allowed" : "pointer",
          opacity: atLimit ? 0.75 : 1,
        }}
        styles={{ body: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" } }}
      >
        <PlusOutlined style={{ fontSize: 20, color: atLimit ? colors.muted : colors.primary }} />
        <div>
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 15,
              fontWeight: 700,
              color: atLimit ? colors.muted : colors.primary,
            }}
          >
            {atLimit ? "Craft Shelf Full" : "New Craft"}
          </div>
          <div style={{ color: colors.muted, fontSize: 12 }}>
            {atLimit
              ? "You can keep up to 10 crafts. Delete one to make room for a new one."
              : "Start a new project"}
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
                {s.title || "Untitled Craft"}
              </div>
              <div style={{ color: colors.muted, fontSize: 12 }}>
                {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            {isCurrent ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: colors.primary,
                    animation: "kpai-pulse 1.4s ease-in-out infinite",
                  }}
                />
                <Text style={{ color: colors.primary, fontWeight: 600, fontSize: 13 }}>CURRENT</Text>
              </div>
            ) : <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => handleDelete(e, s)}
            >
              Delete
            </Button>}
          </Card>
        );
      })}
    </div>
  );
}

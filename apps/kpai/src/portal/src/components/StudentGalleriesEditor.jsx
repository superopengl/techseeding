import React, { useEffect, useMemo, useState } from "react";
import { Select, Tag, Space, message, Typography } from "antd";
import { colors } from "../theme";
import { apiCall } from "../api";

export function StudentGalleriesEditor({ userId, onChange }) {
  const [allGalleries, setAllGalleries] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [galleries, memberships] = await Promise.all([
        apiCall("/api/admin/galleries"),
        apiCall(`/api/admin/user/${userId}/galleries`),
      ]);
      setAllGalleries(galleries);
      setSelectedIds(memberships.map((g) => g.id));
    } catch {
      message.error("Failed to load galleries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const colorById = useMemo(() => {
    const map = new Map();
    for (const g of allGalleries) map.set(g.id, g.colorHex);
    return map;
  }, [allGalleries]);

  const handleChange = async (nextIds) => {
    const prev = selectedIds;
    setSelectedIds(nextIds);
    setSaving(true);
    try {
      const updated = await apiCall(`/api/admin/user/${userId}/galleries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryIds: nextIds }),
      });
      onChange?.(updated);
    } catch (e) {
      message.error(e.message);
      setSelectedIds(prev);
    } finally {
      setSaving(false);
    }
  };

  const options = allGalleries.map((g) => ({ label: g.name, value: g.id, colorHex: g.colorHex }));

  return (
    <div>
      <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
        Galleries
      </Typography.Text>
      <Select
        mode="multiple"
        placeholder={allGalleries.length === 0 ? "No galleries yet — create one in the Galleries tab" : "Assign galleries"}
        value={selectedIds}
        onChange={handleChange}
        loading={loading || saving}
        disabled={allGalleries.length === 0}
        style={{ width: "100%" }}
        optionFilterProp="label"
        options={options}
        tagRender={({ value, closable, onClose }) => {
          const hex = colorById.get(value) || colors.muted;
          const label = allGalleries.find((g) => g.id === value)?.name || value;
          return (
            <Tag
              closable={closable}
              onClose={onClose}
              style={{
                background: hex,
                color: "#fff",
                border: "none",
                fontWeight: 600,
                borderRadius: 12,
                padding: "2px 10px",
                marginRight: 4,
              }}
            >
              {label}
            </Tag>
          );
        }}
        optionRender={(opt) => (
          <Space size={8}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: 3,
                background: opt.data.colorHex,
                border: `1px solid ${colors.border}`,
              }}
            />
            <span>{opt.label}</span>
          </Space>
        )}
      />
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Select, Tag, Space, message } from "antd";
import { colors } from "../theme";
import { apiCall } from "../api";

export function StudentGallerySelect({ userId, value, allGalleries, onChange }) {
  const [saving, setSaving] = useState(false);
  const selectedIds = useMemo(() => (value || []).map((g) => g.id), [value]);

  const byId = useMemo(() => {
    const map = new Map();
    for (const g of allGalleries) map.set(g.id, g);
    return map;
  }, [allGalleries]);

  const handleChange = async (nextIds) => {
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      mode="multiple"
      placeholder={allGalleries.length === 0 ? "No galleries" : "Add gallery"}
      value={selectedIds}
      onChange={handleChange}
      loading={saving}
      disabled={allGalleries.length === 0 || saving}
      style={{ minWidth: 180, width: "100%" }}
      maxTagCount="responsive"
      optionFilterProp="label"
      options={allGalleries.map((g) => ({ label: g.name, value: g.id, colorHex: g.colorHex }))}
      tagRender={({ value: v, closable, onClose }) => {
        const g = byId.get(v);
        return (
          <Tag
            closable={closable}
            onClose={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: g?.colorHex || colors.muted,
              color: "#fff",
              border: "none",
              fontWeight: 600,
              borderRadius: 12,
              padding: "1px 8px",
              margin: 2,
            }}
          >
            {g?.name || v}
          </Tag>
        );
      }}
      optionRender={(opt) => (
        <Space size={6}>
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
  );
}

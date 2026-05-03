import React from "react";
import { Empty } from "antd";
import { colors } from "../theme";

export function CraftPreview({ sandboxId, refreshKey }) {
  if (!sandboxId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.canvas,
        }}
      >
        <Empty description="Loading..." />
      </div>
    );
  }

  return (
    <iframe
      key={refreshKey}
      src={`/api/sandbox/${sandboxId}/preview`}
      title="KidPlayAI - Sandbox Preview"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: colors.surface,
      }}
    />
  );
}

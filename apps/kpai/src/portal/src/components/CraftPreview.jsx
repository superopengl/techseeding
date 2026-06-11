import React from "react";
import { Empty } from "antd";
import { colors } from "../theme";

export function CraftPreview({ refreshKey, src }) {
  if (!src) {
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
      src={src}
      title="KidPlayAI - Sandbox Preview"
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: colors.surface,
      }}
    />
  );
}

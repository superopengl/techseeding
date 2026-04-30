import React from "react";
import { Empty } from "antd";
import { colors } from "../theme";

export function GamePreview({ sandboxId }) {
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
      src={`/sandbox/${sandboxId}/preview`}
      title="Lab67 - Sandbox Preview"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: colors.surface,
      }}
    />
  );
}

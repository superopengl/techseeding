import React from "react";
import { Empty } from "antd";
import { colors } from "../theme";

export function GamePreview({ studentId }) {
  if (!studentId) {
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
      src={`/sandbox/${studentId}/game/index.html`}
      title="Game Preview"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: colors.surface,
      }}
    />
  );
}

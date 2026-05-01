import React from "react";

export function Logo({ size = 32, style }) {
  const padding = Math.round(size * 0.15);
  const outerSize = size + padding * 2;
  return (
    <div
      style={{
        width: outerSize,
        height: outerSize,
        background: "#001122",
        borderRadius: outerSize * 0.24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src="/logo.png"
        alt="Code4Kids"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

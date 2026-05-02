import React from "react";
import { colors } from "../theme";

export function Logo({ size = 32, style, square = false, inverted = false }) {
  if (square) {
    return <SquareLogo size={size} style={style} />;
  }

  const scale = size / 32;
  const width = Math.round(148 * scale);
  const height = Math.round(40 * scale);
  const fontSize = 28 * scale;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0, ...style }}
      role="img"
      aria-label="KidPlayAI"
    >
      <text
        x="0"
        y={height * 0.78}
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 800,
          fontSize,
        }}
      >
        <tspan fill={inverted ? "#fff" : colors.heading}>Kid</tspan>
        <tspan fill={inverted ? colors.accentAmber : colors.primary}>Play</tspan>
        <tspan fill={inverted ? colors.ctaYellow : colors.accentBlue}>AI</tspan>
      </text>
    </svg>
  );
}

function SquareLogo({ size = 128, style }) {
  const r = size * 0.2;
  const topFontSize = size * 0.25;
  const aiFontSize = size * 0.5;
  const bracketFontSize = size * 0.35;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flexShrink: 0, ...style }}
      role="img"
      aria-label="KidPlayAI"
    >
      <rect width={size} height={size} rx={r} ry={r} fill={colors.surface} />
      <text
        x={size / 2}
        y={size * 0.36}
        textAnchor="middle"
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 800,
          fontSize: topFontSize,
        }}
      >
        <tspan fill={colors.heading}>Kid</tspan>
        <tspan fill={colors.primary}>Play</tspan>
      </text>
      <text
        x={size / 2}
        y={size * 0.64}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 700,
          fontSize: aiFontSize,
        }}
      >
        <tspan fill={colors.accentBlue} style={{ fontSize: bracketFontSize }}>{'<'}</tspan>
        <tspan fill={colors.accentBlue}>AI</tspan>
        <tspan fill={colors.accentBlue} style={{ fontSize: bracketFontSize }}>{'>'}</tspan>
      </text>
    </svg>
  );
}

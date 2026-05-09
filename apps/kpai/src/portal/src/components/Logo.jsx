import React, { useLayoutEffect, useRef, useState } from "react";
import { colors } from "../theme";

export function Logo({ size = 32, style, square = false, inverted = false }) {
  if (square) {
    return <SquareLogo size={size} style={style} />;
  }
  return <InlineLogo size={size} style={style} inverted={inverted} />;
}

function InlineLogo({ size, style, inverted }) {
  const scale = size / 32;
  const initialWidth = Math.round(148 * scale);
  const height = Math.round(40 * scale);
  const fontSize = 28 * scale;

  const textRef = useRef(null);
  const [box, setBox] = useState({ x: 0, width: initialWidth });

  useLayoutEffect(() => {
    const measure = () => {
      if (!textRef.current) return;
      const { x, width } = textRef.current.getBBox();
      setBox({ x, width: Math.ceil(width) });
    };
    measure();
    // Baloo 2 may load after first paint — re-measure once it's ready.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }, [fontSize]);

  return (
    <svg
      width={box.width}
      height={height}
      viewBox={`${box.x} 0 ${box.width} ${height}`}
      style={{ display: "block", flexShrink: 0, ...style }}
      role="img"
      aria-label="KidPlayAI"
    >
      <text
        ref={textRef}
        x={initialWidth / 2}
        y={height * 0.78}
        textAnchor="middle"
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
  const r = size * 0.22;
  const topFontSize = size * 0.22;
  const aiFontSize = size * 0.36;
  const bracketFontSize = size * 0.30;

  const kidPlayRef = useRef(null);
  const aiRef = useRef(null);
  const [matchedLen, setMatchedLen] = useState(null);

  // Measure both texts and lock them to a single shared length so KidPlay
  // and <AI> render at the same width. Re-measure once Baloo 2 finishes
  // loading since fallback fonts have different metrics.
  useLayoutEffect(() => {
    const measure = () => {
      if (!kidPlayRef.current || !aiRef.current) return;
      const kw = kidPlayRef.current.getComputedTextLength();
      const aw = aiRef.current.getComputedTextLength();
      const next = Math.max(kw, aw);
      if (next > 0) setMatchedLen(next);
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }, [topFontSize, aiFontSize, bracketFontSize]);

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
        ref={kidPlayRef}
        x={size / 2}
        y={size * 0.40}
        textAnchor="middle"
        textLength={matchedLen ?? undefined}
        lengthAdjust="spacingAndGlyphs"
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
        ref={aiRef}
        x={size / 2}
        y={size * 0.78}
        textAnchor="middle"
        textLength={matchedLen ?? undefined}
        lengthAdjust="spacingAndGlyphs"
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

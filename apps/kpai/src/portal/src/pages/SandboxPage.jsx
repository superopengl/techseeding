import React, { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { Terminal } from "../components/Terminal";
import { GamePreview } from "../components/GamePreview";
import { colors, fonts } from "../theme";

const { Header, Content } = Layout;

const DIVIDER_WIDTH = 6;
const MIN_PANEL_PCT = 15;

export function SandboxPage() {
  const { studentId } = useParams();
  const [leftPct, setLeftPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);

    const onMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(100 - MIN_PANEL_PCT, Math.max(MIN_PANEL_PCT, pct)));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 24px",
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          height: 56,
        }}
      >
        <RocketOutlined style={{ fontSize: 24, color: colors.primary }} />
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 22,
            fontWeight: 700,
            color: colors.heading,
          }}
        >
          Lab67
        </span>
      </Header>
      <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `calc(${leftPct}% - ${DIVIDER_WIDTH / 2}px)`, overflow: "hidden", pointerEvents: isDragging ? "none" : "auto" }}>
          <GamePreview studentId={studentId} />
        </div>
        <div
          onMouseDown={onMouseDown}
          style={{
            width: DIVIDER_WIDTH,
            cursor: "col-resize",
            background: colors.border,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.border)}
        />
        <div style={{ flex: 1, overflow: "hidden", background: colors.terminal, pointerEvents: isDragging ? "none" : "auto" }}>
          <Terminal studentId={studentId} />
        </div>
      </div>
    </Layout>
  );
}

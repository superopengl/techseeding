import React from "react";
import { useParams } from "react-router-dom";
import { Layout } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { Terminal } from "../components/Terminal";
import { GamePreview } from "../components/GamePreview";
import { colors, fonts } from "../theme";

const { Header, Content } = Layout;

export function SandboxPage() {
  const { studentId } = useParams();

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
      <Content style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, borderRight: `1px solid ${colors.border}` }}>
          <GamePreview studentId={studentId} />
        </div>
        <div style={{ flex: 1, background: colors.terminal }}>
          <Terminal studentId={studentId} />
        </div>
      </Content>
    </Layout>
  );
}

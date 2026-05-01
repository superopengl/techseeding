import React, { useEffect } from "react";
import { Layout } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { colors, fonts } from "../theme";
import { SandboxList } from "../components/SandboxList";

const { Header, Content } = Layout;

export function SandboxListPage() {
  useEffect(() => { document.title = "Sandbox List"; }, []);

  return (
    <Layout style={{ minHeight: "100vh", background: colors.canvas }}>
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
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 16,
            color: colors.muted,
            marginLeft: 8,
          }}
        >
          My Games
        </span>
      </Header>

      <Content style={{ padding: 32, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <SandboxList />
      </Content>
    </Layout>
  );
}

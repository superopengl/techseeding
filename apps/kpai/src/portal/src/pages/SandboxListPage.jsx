import React, { useEffect } from "react";
import { Layout } from "antd";
import { colors, fonts } from "../theme";
import { SandboxList } from "../components/SandboxList";
import { Logo } from "../components/Logo";

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
        <Logo size={36} square />
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

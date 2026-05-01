import React from "react";
import { Button, Typography, Card, Row, Col } from "antd";
import {
  RocketOutlined,
  ThunderboltOutlined,
  SmileOutlined,
  CodeOutlined,
  ExperimentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { colors, gradients, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <SmileOutlined />,
    color: colors.primary,
    bg: colors.mintBg,
    title: "Made for Kids",
    description:
      "No coding experience needed. Just describe what you want and watch your game come to life!",
  },
  {
    icon: <ThunderboltOutlined />,
    color: colors.accentAmber,
    bg: colors.amberBg,
    title: "AI-Powered",
    description:
      "Chat with an AI assistant that writes real code for you in seconds.",
  },
  {
    icon: <CodeOutlined />,
    color: colors.accentBlue,
    bg: colors.skyBg,
    title: "Real Games",
    description:
      "Create playable HTML games you can share with friends and family.",
  },
];

const steps = [
  {
    icon: <ExperimentOutlined />,
    color: colors.accentPurple,
    num: "1",
    title: "Describe Your Idea",
    description: 'Tell the AI what game you want, like "a space shooter with aliens".',
  },
  {
    icon: <RocketOutlined />,
    color: colors.primary,
    num: "2",
    title: "AI Builds It",
    description: "Watch the AI write real code and build your game in real time.",
  },
  {
    icon: <TeamOutlined />,
    color: colors.accentAmber,
    num: "3",
    title: "Play & Share",
    description: "Play your game instantly and share it with friends!",
  },
];

const ctaButtonStyle = {
  height: 56,
  paddingInline: 40,
  fontSize: 20,
  fontWeight: 700,
  borderRadius: 28,
  background: colors.ctaYellow,
  color: colors.heading,
  border: "none",
  boxShadow: shadows.ctaButton,
  fontFamily: fonts.heading,
};

function NavBar({ onStart }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 48px",
        background: colors.surface,
        borderBottom: `1px solid ${colors.borderLight}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={36} />
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: 26,
            fontWeight: 700,
            color: colors.heading,
          }}
        >
          Lab67
        </span>
      </div>
      <Button
        type="primary"
        size="large"
        onClick={onStart}
        style={{
          borderRadius: 24,
          paddingInline: 28,
          fontWeight: 600,
          height: 44,
          background: colors.ctaYellow,
          color: colors.heading,
          border: "none",
          boxShadow: shadows.ctaButtonSmall,
        }}
      >
        Get Started
      </Button>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const goLogin = () => navigate("/login");

  return (
    <div style={{ minHeight: "100vh", background: colors.surface }}>
      <NavBar onStart={goLogin} />

      {/* Hero Section */}
      <div
        style={{
          background: gradients.hero,
          padding: "80px 24px 180px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            top: -60,
            left: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            bottom: -40,
            right: 60,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            top: 40,
            right: "20%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <Title
            style={{
              fontFamily: fonts.heading,
              fontSize: 56,
              color: colors.onDark,
              marginBottom: 16,
              lineHeight: 1.2,
              textShadow: shadows.textOnGradient,
            }}
          >
            Create Games with AI!
          </Title>
          <Paragraph
            style={{
              fontSize: 20,
              color: colors.onDarkSecondary,
              marginBottom: 40,
              maxWidth: 540,
              marginInline: "auto",
              lineHeight: 1.6,
            }}
          >
            Imagine a game, describe it in words, and watch AI build it for you —
            no coding needed. It's like magic, but it's real code!
          </Paragraph>
          <Button
            size="large"
            onClick={goLogin}
            icon={<RocketOutlined />}
            style={ctaButtonStyle}
          >
            Start Making Games
          </Button>
        </div>
      </div>

      {/* Floating screenshot showcase — overlaps hero and features */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: -140,
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
            border: "2px solid rgba(255,255,255,0.12)",
            maxWidth: 900,
            marginInline: "auto",
          }}
        >
          <img
            src="/car-racer.png"
            alt="A kid building a Road Racer game with AI in Lab67"
            style={{ width: "100%", display: "block" }}
          />
        </div>
        <Paragraph
          style={{
            color: colors.muted,
            fontSize: 14,
            marginTop: 16,
            fontStyle: "italic",
          }}
        >
          A real game built by a kid — describe your idea, watch AI code it live!
        </Paragraph>
      </div>

      {/* Features Section */}
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "48px 24px 80px",
          textAlign: "center",
        }}
      >
        <Title
          level={2}
          style={{
            fontFamily: fonts.heading,
            fontSize: 38,
            color: colors.heading,
            marginBottom: 12,
          }}
        >
          Why Kids Love Lab67
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 500, marginInline: "auto" }}
        >
          Everything you need to go from idea to playable game
        </Paragraph>
        <Row gutter={[32, 32]}>
          {features.map((f, i) => (
            <Col xs={24} sm={8} key={i}>
              <Card
                style={{
                  borderRadius: 20,
                  border: "none",
                  boxShadow: shadows.card,
                  height: "100%",
                  textAlign: "center",
                  padding: "12px 0",
                }}
                styles={{ body: { padding: "32px 24px" } }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: f.bg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    fontSize: 32,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </div>
                <Title
                  level={4}
                  style={{
                    fontFamily: fonts.heading,
                    color: colors.heading,
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </Title>
                <Text style={{ color: colors.body, fontSize: 15, lineHeight: 1.6 }}>
                  {f.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* How It Works Section */}
      <div
        style={{
          background: colors.canvas,
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <Title
          level={2}
          style={{
            fontFamily: fonts.heading,
            fontSize: 38,
            color: colors.heading,
            marginBottom: 12,
          }}
        >
          How It Works
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 500, marginInline: "auto" }}
        >
          Three simple steps to your very own game
        </Paragraph>
        <Row gutter={[32, 32]} style={{ maxWidth: 1000, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <Col xs={24} sm={8} key={i}>
              <div style={{ position: "relative", padding: "0 8px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: s.color,
                    color: colors.onDark,
                    fontFamily: fonts.heading,
                    fontSize: 26,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: `0 4px 12px ${s.color}40`,
                  }}
                >
                  {s.num}
                </div>
                <Title
                  level={4}
                  style={{
                    fontFamily: fonts.heading,
                    color: colors.heading,
                    marginBottom: 8,
                  }}
                >
                  {s.title}
                </Title>
                <Text style={{ color: colors.body, fontSize: 15, lineHeight: 1.6 }}>
                  {s.description}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: gradients.cta,
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <Title
          level={2}
          style={{
            fontFamily: fonts.heading,
            fontSize: 38,
            color: colors.onDark,
            marginBottom: 16,
            textShadow: shadows.textOnGradient,
          }}
        >
          Ready to Build Something Amazing?
        </Title>
        <Paragraph
          style={{ color: colors.onDarkSecondary, fontSize: 18, marginBottom: 36 }}
        >
          Join Lab67 and start creating your own games today!
        </Paragraph>
        <Button
          size="large"
          onClick={goLogin}
          icon={<RocketOutlined />}
          style={ctaButtonStyle}
        >
          Get Started Free
        </Button>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          background: colors.footer,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Text style={{ color: colors.onDarkTertiary, fontSize: 14 }}>
          Lab67 — AI Game Maker for Kids
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          Lab67 is a product owned by Techseeding
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          &copy;2019&ndash;2026 Techseeding PTY LTD. All rights reserved.
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          ABN: 35631597450 / ACN: 631597450
        </Text>
        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/privacy_policy" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Privacy Policy</a>
          <a href="/terms_of_use" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Terms of Use</a>
          <a href="/admin" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Admin Portal</a>
        </div>
      </div>
    </div>
  );
}

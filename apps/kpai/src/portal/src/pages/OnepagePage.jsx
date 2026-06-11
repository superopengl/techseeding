import React, { useEffect } from "react";
import { Typography, Row, Col } from "antd";
import {
  RocketOutlined,
  RobotOutlined,
  ExperimentOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  BookOutlined,
  CalendarOutlined,
  LaptopOutlined,
  ScheduleOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { setPageTitle } from "../utils/setPageTitle";
import { colors, gradients, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { QRCodeSVG } from "qrcode.react";

const { Title, Text } = Typography;

const reasons = [
  {
    icon: <RobotOutlined />,
    color: colors.accentAmber,
    title: "AI-Ready for the Future",
    text: "Your child learns to use AI as a creative tool — turning their own ideas into real projects.",
  },
  {
    icon: <ExperimentOutlined />,
    color: colors.accentPurple,
    title: "Sparks Curiosity",
    text: "Driving AI to bring ideas to life builds real interest in science, engineering, and play.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    color: colors.accentBlue,
    title: "Safe & Supervised",
    text: "Purpose-built kid AI agent, instructor-guided sessions, sandboxed tools.",
  },
  {
    icon: <ThunderboltOutlined />,
    color: colors.primary,
    title: "Real Working Crafts",
    text: "Not exercises — kids walk away with a real craft they can play, share, and keep improving.",
  },
];

const steps = [
  {
    num: "1",
    color: colors.accentPurple,
    title: "Imagine an Craft",
    text: "Your child types what they want — \"a racing craft with power-ups\" or \"a puzzle where gravity flips.\"",
  },
  {
    num: "2",
    color: colors.primary,
    title: "Command AI to Build It",
    text: "They harness a real AI agent to reason, plan, and create — right in front of them.",
  },
  {
    num: "3",
    color: colors.accentAmber,
    title: "Play, Tweak, Share",
    text: "The craft runs instantly. Improve it, experiment, share with friends.",
  },
];

const programs = [
  { icon: <BookOutlined />, color: colors.primary, bg: colors.mintBg, title: "After School", text: "Weekly hands-on" },
  { icon: <CalendarOutlined />, color: colors.accentPurple, bg: "#f3f0ff", title: "Weekend", text: "Sat / Sun sessions" },
  { icon: <ScheduleOutlined />, color: colors.accentAmber, bg: colors.amberBg, title: "Holiday Camp", text: "Multi-day deep dive" },
  { icon: <LaptopOutlined />, color: colors.accentBlue, bg: colors.skyBg, title: "Online", text: "Live from home" },
];

export function OnepagePage() {
  useEffect(() => {
    setPageTitle(
      "KidPlayAI — Parent Handout",
      "A one-page introduction to KidPlayAI for parents and guardians.",
    );
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.surface,
        padding: "20px",
        fontFamily: fonts.body,
      }}
    >
      <style>{`
        @page { size: A4; margin: 10mm; }
        .onepage-wrap,
        .onepage-wrap * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @media print {
          body { background: #fff !important; }
          .onepage-wrap { box-shadow: none !important; }
          .onepage-wrap *, .onepage-wrap { box-shadow: none !important; }
          .onepage-wrap, .onepage-wrap * { -webkit-font-smoothing: auto !important; text-rendering: geometricPrecision !important; }
        }
      `}</style>

      <div
        className="onepage-wrap"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: colors.surface,
          borderRadius: 16,
          boxShadow: shadows.cardSubtle,
          overflow: "hidden",
        }}
      >
        {/* Header band with hero gradient */}
        <div
          style={{
            background: gradients.hero,
            padding: "26px 32px",
            color: colors.onDark,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              top: -50,
              right: -40,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              bottom: -20,
              left: 80,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
            <Logo size={64} square />
            <Title
              level={2}
              style={{
                fontFamily: fonts.heading,
                color: colors.onDark,
                margin: "6px 0 2px",
                fontSize: 26,
                textShadow: shadows.textOnGradient,
                lineHeight: 1.2,
              }}
            >
              Build It. Master It. For the <span style={{ color: colors.ctaYellow }}>AI</span> Generation.
            </Title>
            <Text style={{ color: colors.onDarkSecondary, fontSize: 13, fontWeight: 600 }}>
              AI craft maker for kids ages 8–12 — they describe a craft, AI builds it, they learn how AI thinks.
            </Text>
          </div>
        </div>

        {/* Proof strip */}
        <div
          style={{
            background: colors.mintBg,
            borderBottom: `1px solid ${colors.border}`,
            padding: "10px 32px",
            textAlign: "center",
            fontFamily: fonts.heading,
            color: colors.heading,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <ThunderboltOutlined style={{ color: colors.accentAmber, marginRight: 6 }} />
          Built crafts can be played and shared via{" "}
          <span style={{ color: colors.primary }}>QR code</span>
          {" or the "}
          <span style={{ color: colors.accentBlue }}>KidPlayAI Viewer</span>
          {" mobile app"}
        </div>

        {/* Why It Matters */}
        <div style={{ padding: "20px 32px 4px" }}>
          <Title level={4} style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 0, marginBottom: 14, fontSize: 18 }}>
            Why It Matters for Your Child
          </Title>
          <Row gutter={[18, 14]}>
            {reasons.map((r, i) => (
              <Col xs={24} sm={12} key={i}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: `${r.color}15`,
                      color: r.color,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: fonts.heading,
                        color: r.color,
                        fontWeight: 700,
                        fontSize: 14.5,
                        marginBottom: 2,
                        lineHeight: 1.25,
                      }}
                    >
                      {r.title}
                    </div>
                    <Text style={{ color: colors.heading, fontSize: 12.5, lineHeight: 1.5, fontWeight: 500 }}>
                      {r.text}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* How It Works */}
        <div style={{ padding: "18px 32px 4px" }}>
          <Title level={4} style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 0, marginBottom: 14, fontSize: 18 }}>
            How It Works
          </Title>
          <Row gutter={[16, 12]}>
            {steps.map((s, i) => (
              <Col xs={24} sm={8} key={i}>
                <div style={{ textAlign: "center", padding: "0 4px" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: s.color,
                      color: colors.onDark,
                      fontFamily: fonts.heading,
                      fontWeight: 700,
                      fontSize: 20,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                      boxShadow: `0 3px 8px ${s.color}40`,
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.heading,
                      color: colors.heading,
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 4,
                      lineHeight: 1.25,
                    }}
                  >
                    {s.title}
                  </div>
                  <Text style={{ color: colors.heading, fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>
                    {s.text}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Programs */}
        <div style={{ padding: "18px 32px 4px" }}>
          <Title level={4} style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 0, marginBottom: 14, fontSize: 18 }}>
            Programs
          </Title>
          <Row gutter={[14, 14]}>
            {programs.map((p, i) => (
              <Col xs={12} sm={6} key={i}>
                <div
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: "14px 12px",
                    textAlign: "center",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: p.bg,
                      color: p.color,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      marginBottom: 8,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.heading,
                      color: colors.heading,
                      fontWeight: 700,
                      fontSize: 13.5,
                      lineHeight: 1.25,
                      marginBottom: 2,
                    }}
                  >
                    {p.title}
                  </div>
                  <Text style={{ color: colors.heading, fontSize: 11.5, fontWeight: 500 }}>{p.text}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 16,
            background: gradients.cta,
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                fontFamily: fonts.heading,
                color: colors.onDark,
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 4,
                textShadow: shadows.textOnGradient,
              }}
            >
              <RocketOutlined style={{ color: colors.ctaYellow, marginRight: 8 }} />
              Ready to get your child started?
            </div>
            <Text style={{ color: colors.onDarkSecondary, fontSize: 12, fontWeight: 500 }}>
              We meet every family before sign-up — it's how we keep the program safe and personal. Send an enquiry through our website to get started.
            </Text>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  background: colors.ctaYellow,
                  borderRadius: 12,
                  padding: "9px 14px",
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  color: colors.heading,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap",
                  boxShadow: shadows.ctaButtonSmall,
                }}
              >
                <GlobalOutlined />
                https://kidplayai.techseeding.com.au
              </div>
            </div>
          </div>
          <div
            style={{
              background: colors.surface,
              borderRadius: 12,
              padding: 8,
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: shadows.ctaButtonSmall,
            }}
          >
            <QRCodeSVG
              value="https://kidplayai.techseeding.com.au"
              size={92}
              level="M"
              bgColor="#ffffff"
              fgColor={colors.heading}
            />
            <div
              style={{
                fontFamily: fonts.heading,
                color: colors.heading,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              Scan to enquire
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

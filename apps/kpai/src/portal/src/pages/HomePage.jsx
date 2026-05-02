import React, { useEffect } from "react";
import { Button, Typography, Card, Row, Col } from "antd";
import {
  RocketOutlined,
  ThunderboltOutlined,
  SmileOutlined,
  BulbOutlined,
  ExperimentOutlined,
  TeamOutlined,
  LoginOutlined,
  PhoneOutlined,
  WechatOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  TrophyOutlined,
  CalendarOutlined,
  LaptopOutlined,
  ScheduleOutlined,
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
    title: "Built for Ages 8\u201312",
    description:
      "No experience needed. If you can imagine it, you can build it. Just describe your idea and let AI bring it to life.",
  },
  {
    icon: <ThunderboltOutlined />,
    color: colors.accentAmber,
    bg: colors.amberBg,
    title: "See How AI Thinks",
    description:
      "Watch a real AI agent reason, design, and solve problems — not hidden behind a button, but right in front of you.",
  },
  {
    icon: <BulbOutlined />,
    color: colors.accentBlue,
    bg: colors.skyBg,
    title: "Your Ideas, Real Games",
    description:
      "Every game is built with real technology. Play it, share it, and see how AI turned your vision into something real.",
  },
];

const steps = [
  {
    icon: <ExperimentOutlined />,
    color: colors.accentPurple,
    num: "1",
    title: "Imagine a Game",
    description: 'Type what you want — "a racing game with power-ups" or "a puzzle where gravity flips."',
  },
  {
    icon: <RocketOutlined />,
    color: colors.primary,
    num: "2",
    title: "Watch AI Build It",
    description: "See the AI think, plan, and create — like a super-powered partner that turns your words into a working game.",
  },
  {
    icon: <TeamOutlined />,
    color: colors.accentAmber,
    num: "3",
    title: "Play, Tweak, Share",
    description: "Your game runs instantly. Keep improving it, experiment with new ideas, and share it with friends.",
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
        background: "linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.85) 220px, rgba(255,255,255,0) 50%)",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <Logo size={36} />
      <Button
        type="primary"
        size="large"
        icon={<LoginOutlined />}
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
        Student Login
      </Button>
    </div>
  );
}

const PHONE_NUMBER = "04XX XXX XXX";
const WECHAT_ID = "your-wechat-id";

const programs = [
  {
    icon: <BookOutlined />,
    color: colors.primary,
    bg: colors.mintBg,
    title: "After School Workshop",
    description: "Weekly hands-on sessions after school. Kids build projects at their own pace with guided support.",
  },
  {
    icon: <CalendarOutlined />,
    color: colors.accentPurple,
    bg: "#f3f0ff",
    title: "Weekend Workshop",
    description: "Saturday or Sunday sessions for kids who want dedicated creative time on the weekend.",
  },
  {
    icon: <ScheduleOutlined />,
    color: colors.accentAmber,
    bg: colors.amberBg,
    title: "Holiday Camp",
    description: "Multi-day intensive camps during school holidays. Deep dive into bigger projects with friends.",
  },
  {
    icon: <LaptopOutlined />,
    color: colors.accentBlue,
    bg: colors.skyBg,
    title: "Online Coaching",
    description: "Live 1-on-1 or small group sessions from home. Same hands-on experience, no commute needed.",
  },
];

const beyondGames = [
  {
    image: "/beyond/science.svg",
    title: "Science Simulations",
    examples: "Solar system orbits, ecosystem models, physics playgrounds",
    borderColor: colors.primary,
  },
  {
    image: "/beyond/art.svg",
    title: "Interactive Art",
    examples: "Drawing apps, generative art, animated greeting cards",
    borderColor: colors.accentPurple,
  },
  {
    image: "/beyond/music.svg",
    title: "Music & Sound",
    examples: "Drum machines, piano keyboards, sound effect boards",
    borderColor: colors.accentBlue,
  },
  {
    image: "/beyond/tools.svg",
    title: "Tools & Utilities",
    examples: "Calculators, timers, quiz makers, to-do lists",
    borderColor: colors.accentAmber,
  },
  {
    image: "/beyond/stories.svg",
    title: "Stories & Chatbots",
    examples: "Choose-your-own-adventure, virtual pets, mad libs",
    borderColor: colors.successGreen,
  },
  {
    image: "/beyond/data.svg",
    title: "Data & Dashboards",
    examples: "Polls with live charts, personal dashboards, family trees",
    borderColor: colors.accentBlue,
  },
];

const parentReasons = [
  {
    icon: <SafetyCertificateOutlined />,
    color: colors.primary,
    title: "Safe & Supervised",
    description: "Every session is supervised. AI tools are sandboxed with strict safety controls — no open internet, no unsafe content.",
  },
  {
    icon: <BookOutlined />,
    color: colors.accentBlue,
    title: "Real Skills, Real Learning",
    description: "Kids learn computational thinking, problem-solving, and how AI actually works — skills that matter for their future.",
  },
  {
    icon: <TrophyOutlined />,
    color: colors.accentAmber,
    title: "Small Classes, Big Impact",
    description: "Small group sessions so every child gets personal attention and guidance. No experience required to start.",
  },
];

export function HomePage() {
  useEffect(() => { document.title = "KidPlayAI — Unleash Kid's Idea. Drive AI to Build It."; }, []);
  const navigate = useNavigate();
  const goLogin = () => navigate("/login");
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.surface }}>
      <NavBar onStart={goLogin} />

      {/* Hero Section */}
      <div
        style={{
          background: gradients.hero,
          padding: "150px 24px 180px",
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
            Unleash Kid's Idea<br />Drive <span style={{ color: colors.ctaYellow }}>AI</span> to Build It
          </Title>
          <Paragraph
            style={{
              fontSize: 20,
              color: colors.onDarkSecondary,
              marginBottom: 44,
              maxWidth: 540,
              marginInline: "auto",
              lineHeight: 1.6,
            }}
          >
            Kids dream it up, AI builds it — and they learn how it all works along the way.
          </Paragraph>
          <Button
            size="large"
            onClick={scrollToContact}
            icon={<RocketOutlined />}
            style={ctaButtonStyle}
          >
            Enquire Now
          </Button>
          <Paragraph style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 12, marginBottom: 0 }}>
            Parents & guardians — reach out to learn about classes, schedule & fees
          </Paragraph>
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
            alt="A kid building a Road Racer game with AI in KidPlayAI"
            style={{ width: "100%", display: "block" }}
          />
        </div>
        <Paragraph
          style={{
            color: colors.body,
            fontSize: 14,
            marginTop: 16,
            fontStyle: "italic",
          }}
        >
          Road Racer — a real game built by a kid using KidPlayAI. Your turn next!
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
          Why Kids Love <Logo size={43} style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -6 }} />
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 500, marginInline: "auto" }}
        >
          Where young creators imagine games and real AI builds them — learning to think, code, and create along the way
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
                <Text style={{ color: colors.bodyStrong, fontSize: 15, lineHeight: 1.6 }}>
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
          From idea to playable game in minutes
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
                <Text style={{ color: colors.bodyStrong, fontSize: 15, lineHeight: 1.6 }}>
                  {s.description}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Programs Section */}
      <div
        style={{
          background: colors.surface,
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
          Our Programs
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 500, marginInline: "auto" }}
        >
          Flexible options to fit every schedule — all ages 8–12 welcome, no experience needed
        </Paragraph>
        <Row gutter={[24, 24]} style={{ maxWidth: 1000, margin: "0 auto" }}>
          {programs.map((p, i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Card
                style={{
                  borderRadius: 20,
                  border: "none",
                  boxShadow: shadows.card,
                  height: "100%",
                  textAlign: "center",
                }}
                styles={{ body: { padding: "32px 20px" } }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: p.bg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                    fontSize: 28,
                    color: p.color,
                  }}
                >
                  {p.icon}
                </div>
                <Title
                  level={4}
                  style={{
                    fontFamily: fonts.heading,
                    color: colors.heading,
                    marginBottom: 8,
                  }}
                >
                  {p.title}
                </Title>
                <Text style={{ color: colors.bodyStrong, fontSize: 14, lineHeight: 1.6 }}>
                  {p.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Beyond Games Section */}
      <div
        style={{
          background: gradients.login,
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
          Games Are Just the Start
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 560, marginInline: "auto" }}
        >
          Building games is how kids get hooked — but with AI as their creative partner, they can make anything they imagine
        </Paragraph>
        <Row gutter={[24, 24]} style={{ maxWidth: 1000, margin: "0 auto" }}>
          {beyondGames.map((item, i) => (
            <Col xs={12} sm={8} key={i}>
              <Card
                style={{
                  borderRadius: 16,
                  border: `2px solid ${item.borderColor}`,
                  boxShadow: shadows.cardSubtle,
                  height: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                }}
                styles={{ body: { padding: 0 } }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: "16px 16px 20px" }}>
                  <Title
                    level={5}
                    style={{
                      fontFamily: fonts.heading,
                      color: colors.heading,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </Title>
                  <Text style={{ color: colors.body, fontSize: 13, lineHeight: 1.5 }}>
                    {item.examples}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* For Parents Section */}
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
          For Parents & Guardians
        </Title>
        <Paragraph
          style={{ color: colors.body, fontSize: 17, marginBottom: 48, maxWidth: 560, marginInline: "auto" }}
        >
          We take your child's safety and learning seriously. Here's what you can expect.
        </Paragraph>
        <Row gutter={[32, 32]} style={{ maxWidth: 1000, margin: "0 auto" }}>
          {parentReasons.map((r, i) => (
            <Col xs={24} sm={8} key={i}>
              <div style={{ fontSize: 36, color: r.color, marginBottom: 16 }}>
                {r.icon}
              </div>
              <Title
                level={4}
                style={{
                  fontFamily: fonts.heading,
                  color: colors.heading,
                  marginBottom: 8,
                }}
              >
                {r.title}
              </Title>
              <Text style={{ color: colors.bodyStrong, fontSize: 15, lineHeight: 1.6 }}>
                {r.description}
              </Text>
            </Col>
          ))}
        </Row>
      </div>

      {/* Contact / Enquiry Section */}
      <div
        id="contact"
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
          Ready to Get Your Child Started?
        </Title>
        <Paragraph
          style={{ color: colors.onDarkSecondary, fontSize: 18, marginBottom: 48, maxWidth: 520, marginInline: "auto" }}
        >
          Contact us to learn about upcoming classes, schedule, and fees. We'd love to hear from you!
        </Paragraph>
        <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 640, margin: "0 auto" }}>
          <Col xs={24} sm={12}>
            <a href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`} style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{
                  borderRadius: 20,
                  border: "2px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.12)",
                  textAlign: "center",
                }}
                styles={{ body: { padding: "32px 24px" } }}
              >
                <PhoneOutlined style={{ fontSize: 40, color: colors.onDark, marginBottom: 16 }} />
                <Title level={4} style={{ fontFamily: fonts.heading, color: colors.onDark, marginBottom: 4 }}>
                  Call Us
                </Title>
                <Text style={{ color: colors.onDarkSecondary, fontSize: 18, fontWeight: 600 }}>
                  {PHONE_NUMBER}
                </Text>
              </Card>
            </a>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              style={{
                borderRadius: 20,
                border: "2px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.12)",
                textAlign: "center",
              }}
              styles={{ body: { padding: "32px 24px" } }}
            >
              <WechatOutlined style={{ fontSize: 40, color: colors.onDark, marginBottom: 16 }} />
              <Title level={4} style={{ fontFamily: fonts.heading, color: colors.onDark, marginBottom: 4 }}>
                WeChat
              </Title>
              <Text style={{ color: colors.onDarkSecondary, fontSize: 18, fontWeight: 600 }}>
                {WECHAT_ID}
              </Text>
            </Card>
          </Col>
        </Row>
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
          KidPlayAI — Unleash Kid's Idea. Drive AI to Build It.
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          KidPlayAI is a product owned by Techseeding
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          &copy;2019&ndash;2026 Techseeding PTY LTD. All rights reserved.
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          ABN: 35631597450 / ACN: 631597450
        </Text>
        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/privacy_policy" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Privacy Policy</a>
          <a href="/terms_of_use" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Terms of Use</a>
          <a href="/admin" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Admin Portal</a>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Typography } from "antd";
import { colors, gradients, fonts } from "../theme";
import { Logo } from "../components/Logo";

const { Title, Text } = Typography;

function Section({ title, bg, children }) {
  return (
    <div style={{ padding: "48px 40px", background: bg }}>
      <Text
        strong
        style={{
          display: "block",
          marginBottom: 24,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: bg === colors.surface || bg === colors.canvas ? colors.body : "rgba(255,255,255,0.7)",
        }}
      >
        {title}
      </Text>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32 }}>
        {children}
      </div>
    </div>
  );
}

function Label({ children, light }) {
  return (
    <Text style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.5)" : colors.muted, display: "block", marginTop: 8 }}>
      {children}
    </Text>
  );
}

export function LogoPage() {
  return (
    <div style={{ minHeight: "100vh", background: colors.canvas }}>
      <div style={{ padding: "48px 40px 24px", borderBottom: `1px solid ${colors.border}` }}>
        <Title level={2} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
          Logo Showcase
        </Title>
        <Text style={{ color: colors.body }}>All logo variations and sizes</Text>
      </div>

      {/* Inline logo — light background */}
      <Section title="Inline Logo — Light Background" bg={colors.surface}>
        <div>
          <Logo size={48} />
          <Label>size=48</Label>
        </div>
        <div>
          <Logo size={32} />
          <Label>size=32 (default)</Label>
        </div>
        <div>
          <Logo size={24} />
          <Label>size=24</Label>
        </div>
        <div>
          <Logo size={16} />
          <Label>size=16</Label>
        </div>
      </Section>

      {/* Inline logo — dark/gradient background */}
      <Section title="Inline Logo — Inverted (on gradient)" bg={gradients.hero}>
        <div>
          <Logo size={48} inverted />
          <Label light>size=48 inverted</Label>
        </div>
        <div>
          <Logo size={32} inverted />
          <Label light>size=32 inverted</Label>
        </div>
        <div>
          <Logo size={24} inverted />
          <Label light>size=24 inverted</Label>
        </div>
        <div>
          <Logo size={16} inverted />
          <Label light>size=16 inverted</Label>
        </div>
      </Section>

      {/* Inline logo — dark solid background */}
      <Section title="Inline Logo — Inverted (on dark)" bg={colors.footer}>
        <div>
          <Logo size={48} inverted />
          <Label light>size=48 inverted</Label>
        </div>
        <div>
          <Logo size={32} inverted />
          <Label light>size=32 inverted</Label>
        </div>
      </Section>

      {/* Square logo — light background */}
      <Section title="Square Logo — Light Background" bg={colors.surface}>
        <div>
          <Logo size={128} square />
          <Label>size=128</Label>
        </div>
        <div>
          <Logo size={96} square />
          <Label>size=96</Label>
        </div>
        <div>
          <Logo size={64} square />
          <Label>size=64</Label>
        </div>
        <div>
          <Logo size={48} square />
          <Label>size=48</Label>
        </div>
      </Section>

      {/* Square logo — dark/gradient background */}
      <Section title="Square Logo — On Gradient" bg={gradients.cta}>
        <div>
          <Logo size={128} square />
          <Label light>size=128</Label>
        </div>
        <div>
          <Logo size={96} square />
          <Label light>size=96</Label>
        </div>
        <div>
          <Logo size={64} square />
          <Label light>size=64</Label>
        </div>
      </Section>

      {/* Inline in text context */}
      <Section title="Inline Logo in Text" bg={colors.surface}>
        <Title level={2} style={{ fontFamily: fonts.heading, fontSize: 38, color: colors.heading, margin: 0 }}>
          Why Kids Love <Logo size={43} style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -6 }} />
        </Title>
      </Section>
    </div>
  );
}

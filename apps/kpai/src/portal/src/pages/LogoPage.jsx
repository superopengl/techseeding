import React, { useState, useEffect } from "react";
import { Typography, Slider } from "antd";
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

function Swatch({ name, value }) {
  const isLight = ["#fff", "#f7fafc", "#e8f8f0", "#fef9e7", "#e8f4fa", "#f0f0f0", "#e2e8f0"].includes(value);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        background: value,
        border: isLight ? `1px solid ${colors.border}` : "none",
      }} />
      <Text style={{ fontSize: 11, color: colors.muted, display: "block", marginTop: 6 }}>{name}</Text>
      <Text style={{ fontSize: 10, color: colors.muted, fontFamily: "monospace" }}>{value}</Text>
    </div>
  );
}

export function LogoPage() {
  useEffect(() => { document.title = "Logo Showcase"; }, []);
  const [sliderSize, setSliderSize] = useState(64);

  return (
    <div style={{ minHeight: "100vh", background: colors.canvas }}>
      <div style={{ padding: "48px 40px 24px", borderBottom: `1px solid ${colors.border}` }}>
        <Title level={2} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
          Logo Showcase
        </Title>
        <Text style={{ color: colors.body }}>All logo variations and sizes</Text>
      </div>

      {/* Interactive size slider */}
      <Section title="Interactive Size" bg={colors.surface}>
        <div style={{ width: "100%" }}>
          <div style={{ maxWidth: 480, marginBottom: 24 }}>
            <Slider
              min={12}
              max={500}
              value={sliderSize}
              onChange={setSliderSize}
              tooltip={{ formatter: (v) => `${v}px` }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32 }}>
            <div>
              <Logo size={sliderSize} />
              <Label>inline — {sliderSize}px</Label>
            </div>
            <div>
              <Logo size={sliderSize} square />
              <Label>square — {sliderSize}px</Label>
            </div>
            <div>
              <Logo size={sliderSize} inverted />
              <Label>inverted — {sliderSize}px</Label>
            </div>
          </div>
        </div>
      </Section>

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

      {/* Color Palette */}
      <div style={{ padding: "48px 40px", borderTop: `1px solid ${colors.border}` }}>
        <Text
          strong
          style={{
            display: "block",
            marginBottom: 24,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: colors.body,
          }}
        >
          Color Palette
        </Text>

        <Text strong style={{ display: "block", marginBottom: 12, color: colors.heading }}>Brand</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          {[
            { name: "Primary", value: colors.primary },
            { name: "CTA Yellow", value: colors.ctaYellow },
            { name: "Accent Blue", value: colors.accentBlue },
            { name: "Accent Purple", value: colors.accentPurple },
            { name: "Accent Amber", value: colors.accentAmber },
            { name: "Success Green", value: colors.successGreen },
          ].map(({ name, value }) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>

        <Text strong style={{ display: "block", marginBottom: 12, color: colors.heading }}>Text</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          {[
            { name: "Heading", value: colors.heading },
            { name: "Body Strong", value: colors.bodyStrong },
            { name: "Body", value: colors.body },
            { name: "Muted", value: colors.muted },
          ].map(({ name, value }) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>

        <Text strong style={{ display: "block", marginBottom: 12, color: colors.heading }}>Backgrounds</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          {[
            { name: "Surface", value: colors.surface },
            { name: "Canvas", value: colors.canvas },
            { name: "Terminal", value: colors.terminal },
            { name: "Footer", value: colors.footer },
            { name: "Mint Bg", value: colors.mintBg },
            { name: "Amber Bg", value: colors.amberBg },
            { name: "Sky Bg", value: colors.skyBg },
          ].map(({ name, value }) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>

        <Text strong style={{ display: "block", marginBottom: 12, color: colors.heading }}>Borders</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          {[
            { name: "Border", value: colors.border },
            { name: "Border Light", value: colors.borderLight },
          ].map(({ name, value }) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>

        <Text strong style={{ display: "block", marginBottom: 12, color: colors.heading }}>Gradients</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            { name: "Hero", value: gradients.hero },
            { name: "CTA", value: gradients.cta },
            { name: "Login", value: gradients.login },
          ].map(({ name, value }) => (
            <div key={name} style={{ textAlign: "center" }}>
              <div style={{
                width: 120,
                height: 64,
                borderRadius: 12,
                background: value,
                border: `1px solid ${colors.border}`,
              }} />
              <Text style={{ fontSize: 11, color: colors.muted, display: "block", marginTop: 6 }}>{name}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

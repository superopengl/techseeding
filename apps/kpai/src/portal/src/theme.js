// Lab67 Design Tokens
// See docs/color-palette.md for full documentation.

export const colors = {
  // Brand
  primary: "#43b88c",
  ctaYellow: "#fcd63c",
  ctaYellowShadow: "#e5be2a",
  accentBlue: "#6ec1e4",
  accentPurple: "#7c5cfc",
  accentAmber: "#f59e0b",
  successGreen: "#61ce70",

  // Text
  heading: "#2d3748",
  body: "#718096",
  muted: "#a0aec0",
  onDark: "#fff",
  onDarkSecondary: "rgba(255,255,255,0.9)",
  onDarkTertiary: "rgba(255,255,255,0.6)",

  // Backgrounds
  surface: "#fff",
  canvas: "#f7fafc",
  terminal: "#1a1a2e",
  footer: "#2d3748",

  // Icon badge tints
  mintBg: "#e8f8f0",
  amberBg: "#fef9e7",
  skyBg: "#e8f4fa",
  loginGradientStart: "#e8f8f0",
  loginGradientEnd: "#e8f4fa",

  // Borders
  border: "#e2e8f0",
  borderLight: "#f0f0f0",
};

export const gradients = {
  hero: "linear-gradient(135deg, #43b88c 0%, #6ec1e4 100%)",
  cta: "linear-gradient(135deg, #7c5cfc 0%, #6ec1e4 100%)",
  login: "linear-gradient(135deg, #e8f8f0 0%, #e8f4fa 100%)",
};

export const shadows = {
  card: "0 4px 24px rgba(0,0,0,0.06)",
  cardElevated: "0 8px 32px rgba(0,0,0,0.08)",
  cardSubtle: "0 2px 12px rgba(0,0,0,0.04)",
  textOnGradient: "0 2px 8px rgba(0,0,0,0.12)",
  ctaButton: "0 4px 0 #e5be2a",
  ctaButtonSmall: "0 2px 0 #e5be2a",
};

export const fonts = {
  heading: "'Baloo 2', cursive",
  body: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Ant Design theme config — pass to <ConfigProvider theme={antTheme}>
export const antTheme = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.successGreen,
    colorWarning: colors.ctaYellow,
    colorInfo: colors.accentBlue,
    borderRadius: 16,
    fontFamily: fonts.body,
  },
};

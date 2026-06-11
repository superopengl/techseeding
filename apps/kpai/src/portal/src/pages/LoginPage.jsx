import React, { useState, useEffect, useRef } from "react";
import { setPageTitle } from "../utils/setPageTitle";
import { Button, Input, Typography, Card, Space } from "antd";
import { ArrowLeftOutlined, MailOutlined, SendOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { colors, gradients, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { PlayfulBackdrop } from "../components/PlayfulBackdrop";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useUser } from "../context/UserContext";

const { Title, Paragraph, Text, Link } = Typography;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{6}$/;

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    const err = new Error(json.error?.message || "Request failed");
    err.code = json.error?.code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export function LoginPage() {
  useEffect(() => { setPageTitle("Login"); }, []);
  const navigate = useNavigate();
  const { refresh: refreshUser } = useUser();

  const [stage, setStage] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRef = useRef(null);

  const goAfterLogin = async (role) => {
    await refreshUser();
    navigate(role === "admin" ? "/admin" : "/sandbox");
  };

  // Tick down the OTP TTL once we have an expiresAt. Stops naturally when the
  // user navigates away (effect cleanup) or when expiresAt clears on retry.
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const sendOtp = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      const data = await postJson("/api/login/email", { email: value });
      setExpiresAt(data.expiresAt);
      setCode("");
      setCodeError(null);
      setResendCooldown(30);
      setStage("code");
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (e) {
      setEmailError(e.message || "Could not send code. Try again.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (codeValue = code) => {
    const value = codeValue.trim();
    if (!CODE_RE.test(value)) {
      setCodeError("Enter the 6-digit code from your email");
      return;
    }
    setCodeError(null);
    setVerifying(true);
    try {
      const data = await postJson("/api/login/otp", { email: email.trim().toLowerCase(), code: value });
      await goAfterLogin(data.role);
    } catch (e) {
      setCodeError(e.message || "That code didn't work. Try again.");
      setCode("");
      codeRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: gradients.login,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  };

  const cardStyle = {
    borderRadius: 24,
    border: "none",
    boxShadow: shadows.cardElevated,
    maxWidth: 440,
    width: "100%",
    position: "relative",
    zIndex: 1,
  };

  if (stage === "code") {
    const expired = expiresAt && remaining <= 0;
    return (
      <div style={containerStyle}>
        <PlayfulBackdrop />
        <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Logo size={56} style={{ marginBottom: 12, marginInline: "auto" }} />
            <Title level={3} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
              Check your email
            </Title>
            <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
              We sent a 6-digit code to <strong style={{ color: colors.heading }}>{email}</strong>.
            </Paragraph>
          </div>
          <Space direction="vertical" size="middle" style={{ width: "100%", alignItems: "center" }}>
            <Input.OTP
              ref={codeRef}
              length={6}
              size="large"
              value={code}
              onInput={(cells) => {
                setCode(cells.join(""));
                setCodeError(null);
              }}
              onChange={(value) => {
                setCode(value);
                if (!expired) verifyOtp(value);
              }}
              formatter={(str) => str.replace(/\D/g, "")}
              autoFocus
            />
            <Button
              type="primary"
              size="large"
              block
              loading={verifying}
              onClick={() => verifyOtp()}
              disabled={!CODE_RE.test(code) || expired}
              style={{
                height: 48,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                background: colors.ctaYellow,
                color: colors.heading,
                border: "none",
                boxShadow: shadows.ctaButtonSmall,
              }}
            >
              {expired ? "Code expired" : "Sign in"}
            </Button>
            {codeError && (
              <div style={{ color: colors.error || "#ff4d4f", textAlign: "center" }}>{codeError}</div>
            )}
            {!codeError && expiresAt && (
              <div style={{ textAlign: "center", color: colors.muted, fontSize: 13 }}>
                {expired
                  ? "This code has expired. Tap Resend to get a fresh one."
                  : `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
              </div>
            )}
          </Space>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setStage("email");
                setCode("");
                setCodeError(null);
              }}
              style={{ color: colors.muted, paddingInline: 0 }}
            >
              Change email
            </Button>
            <Button
              type="link"
              loading={sending}
              disabled={resendCooldown > 0}
              onClick={sendOtp}
              style={{ color: colors.primary, paddingInline: 0 }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <PlayfulBackdrop />
      <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span
            role="button"
            tabIndex={0}
            onClick={() => navigate("/")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/");
              }
            }}
            style={{ display: "inline-block", cursor: "pointer" }}
            aria-label="Go to home"
          >
            <Logo size={56} style={{ marginBottom: 12, marginInline: "auto" }} />
          </span>
          <Title level={3} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
            Log in to KidPlayAI
          </Title>
          <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
            One-tap with Google, or get a code sent to your email.
          </Paragraph>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <GoogleSignInButton width={320} scale={1.2} onSuccess={(data) => goAfterLogin(data.role)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>or</Text>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        </div>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            size="large"
            type="email"
            placeholder="your@email.com"
            allowClear
            autoFocus
            maxLength={120}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
            onPressEnter={sendOtp}
            prefix={<MailOutlined style={{ color: colors.muted }} />}
            style={{ borderRadius: 12, height: 48 }}
            styles={{ input: { textAlign: "center" } }}
          />
          <Button
            type="primary"
            size="large"
            block
            loading={sending}
            onClick={sendOtp}
            disabled={!email.trim()}
            icon={<SendOutlined/>}
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              background: colors.ctaYellow,
              color: colors.heading,
              border: "none",
              boxShadow: shadows.ctaButtonSmall,
            }}
          >
            Email me code
          </Button>
          {emailError && (
            <div style={{ color: colors.error || "#ff4d4f", textAlign: "center" }}>{emailError}</div>
          )}
        </Space>
        <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          By logging in you agree to our{" "}
          <Link href="/terms_of_use" target="_blank" rel="noopener noreferrer">Terms of Use</Link>{" "}
          and{" "}
          <Link href="/privacy_policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
        </Paragraph>
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { setPageTitle } from "../utils/setPageTitle";
import { Button, Input, Typography, Card, Space, Result, Modal, Row, Col } from "antd";
import { ClockCircleOutlined, PhoneOutlined, WechatOutlined, RocketOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Loading } from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { colors, gradients, shadows, fonts } from "../theme";
import { Logo } from "../components/Logo";
import { PlayfulBackdrop } from "../components/PlayfulBackdrop";
import { apiCall } from "../api";
import { useUser } from "../context/UserContext";

const { Title, Paragraph, Text, Link } = Typography;

const PHONE_NUMBER = "04XX XXX XXX";
const WECHAT_ID = "your-wechat-id";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 50;

export function LoginPage() {
  useEffect(() => { setPageTitle("Login"); }, []);
  const navigate = useNavigate();
  const { refresh: refreshUser } = useUser();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [loginRequestId, setLoginRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pendingReason, setPendingReason] = useState("first_time");
  const [remaining, setRemaining] = useState(600);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (!loginRequestId || status !== "pending") return;

    const TIMEOUT_MS = 10 * 60 * 1000;
    const deadline = Date.now() + TIMEOUT_MS;
    setRemaining(Math.ceil(TIMEOUT_MS / 1000));

    let cancelled = false;
    let ws = null;
    let reconnectTimer = null;

    const tickId = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setStatus("timedout");
    }, 1000);

    const consumeApproval = async () => {
      if (cancelled) return;
      try {
        const data = await apiCall(`/api/login/${loginRequestId}/status`);
        if (cancelled || data.status !== "approved") return;
        // Don't change status — leave the "Waiting for approval" screen
        // up until navigation unmounts this page. Switching to any other
        // status here would briefly flash the username/password screen.
        cancelled = true;
        await refreshUser();
        navigate(data.role === "admin" ? "/admin" : "/sandbox");
      } catch {
        // Approval consumption failed; the WS will retry on next status push.
      }
    };

    const connect = () => {
      if (cancelled) return;
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}/api/ws/login/${loginRequestId}`);
      ws.onmessage = (e) => {
        try {
          const { type, payload } = JSON.parse(e.data);
          if (type === "status" && payload?.status === "approved") consumeApproval();
        } catch { /* ignore malformed frames */ }
      };
      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        try { ws.close(); } catch { /* already closing */ }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearInterval(tickId);
      clearTimeout(reconnectTimer);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING)) {
        try { ws.close(); } catch { /* already closed */ }
      }
    };
  }, [loginRequestId, status, navigate, refreshUser]);

  const USER_NAME_RE = /^[a-zA-Z0-9_/]+$/;
  const trimmedId = identifier.trim();

  const postJson = async (path, body) => {
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
  };

  const handleApprovalResponse = (data, reason) => {
    setLoginRequestId(data.loginRequestId);
    setRemaining(600);
    setPendingReason(reason);
    setStatus("pending");
    setPassword("");
  };

  const handleAuthenticated = async (data) => {
    await refreshUser();
    navigate(data.role === "admin" ? "/admin" : "/sandbox");
  };

  const handleSubmit = async () => {
    const id = identifier.trim();
    if (!id) return;
    if (!USER_NAME_RE.test(id)) {
      setLoginError("Your name can only have letters, numbers, _ or /");
      return;
    }
    setLoginError(null);
    setPasswordError(null);
    setLoading(true);
    try {
      const data = await postJson("/api/login", { userName: id });
      if (data.needsApproval) {
        handleApprovalResponse(data, "forgot");
        return;
      }
      setPassword("");
      setStatus("password");
      setTimeout(() => passwordRef.current?.focus(), 0);
    } catch (e) {
      setLoginError(e.message || "Could not continue. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const id = identifier.trim();
    if (!id) return;
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      setPasswordError(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
      return;
    }
    setLoading(true);
    setPasswordError(null);
    try {
      const data = await postJson("/api/login", { userName: id, password });
      if (data.needsApproval) {
        handleApprovalResponse(data, "first_time");
        return;
      }
      if (data.role) {
        handleAuthenticated(data);
        return;
      }
      setPasswordError("Unexpected response. Please try again.");
    } catch (e) {
      setPasswordError(e.message || "Wrong username or password");
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const id = identifier.trim();
    if (!id) return;
    setForgotLoading(true);
    setPasswordError(null);
    try {
      const data = await postJson("/api/login/reset", { userName: id });
      handleApprovalResponse(data, "forgot");
    } catch (e) {
      setPasswordError(e.message || "Could not send request. Try again.");
    } finally {
      setForgotLoading(false);
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

  if (status === "password") {
    return (
      <div style={containerStyle}>
        <PlayfulBackdrop />
        <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Logo size={56} style={{ marginBottom: 12, marginInline: "auto" }} />
            <Title
              level={3}
              style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}
            >
              Welcome back, {identifier}!
            </Title>
            <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
              Enter your password to log in.
            </Paragraph>
          </div>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Input.Password
              ref={passwordRef}
              size="large"
              placeholder="Password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
              onPressEnter={handlePasswordSubmit}
              style={{ borderRadius: 12, height: 48 }}
              styles={{ input: { textAlign: "center", fontWeight: 600 } }}
              autoFocus
            />
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handlePasswordSubmit}
              disabled={password.length < PASSWORD_MIN_LENGTH}
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
              Login
            </Button>
            {passwordError && (
              <div style={{ color: colors.error || "#ff4d4f", textAlign: "center" }}>
                {passwordError}
              </div>
            )}
          </Space>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setStatus(null);
                setPassword("");
                setPasswordError(null);
              }}
              style={{ color: colors.muted, paddingInline: 0 }}
            >
              Back
            </Button>
            <Button
              type="link"
              loading={forgotLoading}
              onClick={handleForgotPassword}
              style={{ color: colors.primary, paddingInline: 0 }}
            >
              Forgot password?
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={containerStyle}>
        <PlayfulBackdrop />
        <Card style={{ ...cardStyle, textAlign: "center" }} styles={{ body: { padding: "48px 32px" } }}>
          <Loading size="large" />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 24 }}
          >
            Waiting for Approval
          </Title>
          <Paragraph style={{ color: colors.body, fontSize: 16, marginBottom: 8 }}>
            {pendingReason === "forgot" ? (
              <>Hi <strong style={{ color: colors.heading }}>{identifier}</strong>! We will approve your login and help you reset your password shortly.</>
            ) : (
              <>Hi <strong style={{ color: colors.heading }}>{identifier}</strong>! We will approve your login shortly. Hang tight!</>
            )}
          </Paragraph>
          <div
            style={{
              background: colors.mintBg,
              color: colors.bodyStrong,
              fontSize: 14,
              borderRadius: 12,
              padding: "10px 16px",
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            👉 Let your teacher know you're ready!
          </div>
          {remaining <= 120 && remaining > 0 && (
            <div style={{ color: colors.accentAmber, fontSize: 13, marginBottom: 12 }}>
              Still waiting — {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} left before timeout
            </div>
          )}
          <Button
            type="link"
            onClick={() => {
              setStatus(null);
              setIdentifier("");
            }}
            style={{ color: colors.primary, fontSize: 14 }}
          >
            Wrong name? Start over
          </Button>
        </Card>
      </div>
    );
  }

  if (status === "timedout") {
    return (
      <div style={containerStyle}>
        <PlayfulBackdrop />
        <Card style={{ ...cardStyle, textAlign: "center" }} styles={{ body: { padding: "48px 32px" } }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: colors.accentAmber, marginBottom: 12 }} />
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginTop: 12 }}
          >
            Timed Out
          </Title>
          <Paragraph style={{ color: colors.body, fontSize: 16 }}>
            Your login request was not approved within 10 minutes. Please try again.
          </Paragraph>
          <Button
            type="primary"
            onClick={() => {
              setStatus(null);
              setIdentifier("");
            }}
            style={{
              borderRadius: 20,
              height: 44,
              paddingInline: 28,
              marginTop: 8,
              background: colors.ctaYellow,
              color: colors.heading,
              border: "none",
              boxShadow: shadows.ctaButtonSmall,
            }}
          >
            Login Again
          </Button>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div style={containerStyle}>
        <PlayfulBackdrop />
        <Card style={cardStyle} styles={{ body: { padding: "48px 32px" } }}>
          <Result
            status="error"
            title="Login Rejected"
            subTitle="Your login request was not approved. Please ask your teacher for help."
            extra={
              <Button
                type="primary"
                onClick={() => {
                  setStatus(null);
                  setIdentifier("");
                }}
                style={{ borderRadius: 20, height: 44, paddingInline: 28 }}
              >
                Try Again
              </Button>
            }
          />
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
          <Title
            level={3}
            style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}
          >
            Login to KidPlayAI
          </Title>
          <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
            Enter your username to log in.
          </Paragraph>
        </div>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            size="large"
            placeholder="Username"
            allowClear
            autoFocus
            maxLength={100}
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setLoginError(null); }}
            onPressEnter={handleSubmit}
            style={{ borderRadius: 12, height: 48 }}
            styles={{ input: { textAlign: "center", fontWeight: 600 } }}
          />
          <div>
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleSubmit}
              disabled={!trimmedId}
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
              Continue
            </Button>

          </div>
          {loginError && (
            <div style={{ color: colors.error || "#ff4d4f", textAlign: "center" }}>
              {loginError}
            </div>
          )}
        </Space>
        <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 24, marginBottom: 0 }}>
          New here? To keep our young learners safe, we set up accounts offline. <Link onClick={() => navigate("/#contact")}>Get in touch</Link> and we'll follow up with class details, schedule, and fees.
        </Paragraph>
        <Paragraph style={{ color: colors.muted, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
          By logging in you agree to our{" "}
          <Link href="/terms_of_use" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy_policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
          .
        </Paragraph>
      </Card>

      {/* Contact Modal */}
      <Modal
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{
          content: { borderRadius: 24, padding: "40px 32px", textAlign: "center" },
        }}
      >
        <RocketOutlined style={{ fontSize: 40, color: colors.primary, marginBottom: 16 }} />
        <Title
          level={3}
          style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 8 }}
        >
          Get in Touch
        </Title>
        <Paragraph style={{ color: colors.body, fontSize: 15, marginBottom: 32, maxWidth: 360, marginInline: "auto" }}>
          Reach out to learn about upcoming classes, schedule, and fees. We'd love to hear from you!
        </Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <a href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`} style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  border: `2px solid ${colors.primary}`,
                  textAlign: "center",
                }}
                styles={{ body: { padding: "24px 16px" } }}
              >
                <PhoneOutlined style={{ fontSize: 32, color: colors.primary, marginBottom: 12 }} />
                <Title level={5} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
                  Call Us
                </Title>
                <Text style={{ color: colors.bodyStrong, fontSize: 16, fontWeight: 600 }}>
                  {PHONE_NUMBER}
                </Text>
              </Card>
            </a>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              style={{
                borderRadius: 16,
                border: `2px solid ${colors.successGreen}`,
                textAlign: "center",
              }}
              styles={{ body: { padding: "24px 16px" } }}
            >
              <WechatOutlined style={{ fontSize: 32, color: colors.successGreen, marginBottom: 12 }} />
              <Title level={5} style={{ fontFamily: fonts.heading, color: colors.heading, marginBottom: 4 }}>
                WeChat
              </Title>
              <Text style={{ color: colors.bodyStrong, fontSize: 16, fontWeight: 600 }}>
                {WECHAT_ID}
              </Text>
            </Card>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}
